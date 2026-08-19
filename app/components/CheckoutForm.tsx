"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { lineItemTotal } from "@/lib/cart/cartLogic";
import { isOrderingOpen, getOrderingClosedMessage, DEFAULT_ORDER_HOURS } from "@/lib/orderHours";

export interface CheckoutData {
  customerName: string;
  customerPhone: string;
  fulfillmentType: "collection" | "delivery";
  deliveryAddress: string;
  deliveryArea: string;
  deliveryDirections: string;
  specialInstructions: string;
}

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  submitting: boolean;
}

const emptyCheckoutData: CheckoutData = {
  customerName: "",
  customerPhone: "",
  fulfillmentType: "collection",
  deliveryAddress: "",
  deliveryArea: "",
  deliveryDirections: "",
  specialInstructions: "",
};

export default function CheckoutForm({ onSubmit, submitting }: CheckoutFormProps) {
  const { lines, subtotal, dispatch } = useCart();
  const [data, setData] = useState<CheckoutData>(emptyCheckoutData);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);

  // Fetch the configured delivery fee only when delivery is actually
  // selected — no point querying settings for a collection order that
  // will never use it.
  useEffect(() => {
    if (data.fulfillmentType !== "delivery") {
      setDeliveryFee(null);
      return;
    }
    supabase
      .from("restaurant_settings")
      .select("delivery_fee")
      .single()
      .then(({ data: row }) => setDeliveryFee(row?.delivery_fee ?? null));
  }, [data.fulfillmentType]);

  const displayTotal = subtotal + (deliveryFee ?? 0);

  // Order hours check evaluated at render time. Uses DEFAULT_ORDER_HOURS
  // (the brief's stated hours) as a fallback — once restaurant_settings
  // is wired into a shared settings context, this should read the live
  // admin-configured hours instead. Flagging that here rather than
  // silently hardcoding it as if it were final.
  const now = new Date();
  const orderingOpen = isOrderingOpen(now, DEFAULT_ORDER_HOURS);
  const closedMessage = getOrderingClosedMessage(now, DEFAULT_ORDER_HOURS);

  // Validation — per brief: name required, phone required, at least one
  // item, delivery address required if delivery selected. Computed on
  // every render rather than only on submit, so the submit button's
  // disabled state and the inline error messages stay in sync.
  const errors: Record<string, string> = {};
  if (!data.customerName.trim()) errors.customerName = "Name is required.";
  if (!data.customerPhone.trim()) errors.customerPhone = "Phone number is required.";
  if (lines.length === 0) errors.cart = "Your order is empty — add something from the menu first.";
  if (data.fulfillmentType === "delivery" && !data.deliveryAddress.trim()) {
    errors.deliveryAddress = "Delivery address is required for delivery orders.";
  }

  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = !hasErrors && orderingOpen && !submitting;

  function update<K extends keyof CheckoutData>(key: K, value: CheckoutData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) return; // brief requirement: block incomplete submissions entirely
    onSubmit(data);
  }

  const showError = (field: string) => attemptedSubmit && errors[field];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {!orderingOpen && (
        <div
          role="alert"
          className="bg-ember/10 border border-ember/40 rounded-sm p-4 text-center"
        >
          <p className="font-body font-bold text-ember uppercase tracking-wide">
            Online orders are currently closed
          </p>
          <p className="font-body text-bone/70 text-sm mt-1">{closedMessage}</p>
          <p className="font-body text-bone/50 text-xs mt-2">
            You can still browse the menu and build your order below — you just
            won&apos;t be able to submit it until we&apos;re open.
          </p>
        </div>
      )}

      {/* Order summary — editable in place. This is the checkout page, which
          is the mobile "Order" tab's only entry point (it skips the cart
          drawer entirely on small screens), so this has to be a fully
          functional edit surface on its own, not a read-only recap that
          sends someone back to the menu to fix a wrong quantity. Uses the
          same UPDATE_QUANTITY / REMOVE_LINE actions CartDrawer already
          dispatches — no new cart logic, just exposing it here too. */}
      <div className="bg-smoke-light border border-bone/10 rounded-sm p-4">
        <h3 className="font-body font-bold text-bone mb-3">Your Order</h3>
        {lines.length === 0 ? (
          <p className="font-body text-bone/50 text-sm">No items yet.</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.cartLineId} className="flex items-start justify-between gap-3 pb-3 border-b border-bone/10 last:border-b-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-bone/90">{line.name}</p>
                  {line.resolvedChoices.length > 0 && (
                    <p className="font-body text-bone/50 text-xs">
                      {line.resolvedChoices.map((c) => c.choiceName).join(", ")}
                    </p>
                  )}
                  {line.selectedAddons.length > 0 && (
                    <p className="font-body text-bone/50 text-xs">
                      + {line.selectedAddons.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: { cartLineId: line.cartLineId, quantity: line.quantity - 1 },
                        })
                      }
                      aria-label={`Decrease quantity of ${line.name}`}
                      className="w-7 h-7 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
                    >
                      &minus;
                    </button>
                    <span className="font-utility text-bone text-sm w-5 text-center" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: { cartLineId: line.cartLineId, quantity: line.quantity + 1 },
                        })
                      }
                      aria-label={`Increase quantity of ${line.name}`}
                      className="w-7 h-7 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "REMOVE_LINE", payload: { cartLineId: line.cartLineId } })
                      }
                      className="font-body text-ember text-xs ml-2 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <span className="font-utility text-bone shrink-0">
                  R{lineItemTotal(line).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data.fulfillmentType === "delivery" && deliveryFee !== null && deliveryFee > 0 && (
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-bone/10">
            <span className="font-body text-bone/60">Delivery Fee</span>
            <span className="font-utility text-bone/60">R{deliveryFee.toFixed(0)}</span>
          </div>
        )}
        <div className="border-t border-bone/10 mt-3 pt-3 flex justify-between font-bold">
          <span className="font-body text-bone">Order Total</span>
          <span className="font-utility text-flame text-lg">R{displayTotal.toFixed(0)}</span>
        </div>
        {showError("cart") && (
          <p className="text-ember text-xs mt-2">{errors.cart}</p>
        )}
      </div>

      {/* Customer info */}
      <div className="space-y-4">
        <h3 className="font-body font-bold text-bone">Customer Information</h3>

        <div>
          <label htmlFor="customerName" className="block font-body text-sm text-bone/70 mb-1">
            Name
          </label>
          <input
            id="customerName"
            type="text"
            value={data.customerName}
            onChange={(e) => update("customerName", e.target.value)}
            aria-invalid={!!showError("customerName")}
            aria-describedby={showError("customerName") ? "customerName-error" : undefined}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          />
          {showError("customerName") && (
            <p id="customerName-error" className="text-ember text-xs mt-1">
              {errors.customerName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="customerPhone" className="block font-body text-sm text-bone/70 mb-1">
            Phone / WhatsApp Number
          </label>
          <input
            id="customerPhone"
            type="tel"
            value={data.customerPhone}
            onChange={(e) => update("customerPhone", e.target.value)}
            aria-invalid={!!showError("customerPhone")}
            aria-describedby={showError("customerPhone") ? "customerPhone-error" : undefined}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          />
          {showError("customerPhone") && (
            <p id="customerPhone-error" className="text-ember text-xs mt-1">
              {errors.customerPhone}
            </p>
          )}
        </div>
      </div>

      {/* Order type */}
      <div className="space-y-3">
        <h3 className="font-body font-bold text-bone">Order Type</h3>
        <div className="flex gap-3">
          {(["collection", "delivery"] as const).map((type) => (
            <label
              key={type}
              className={`flex-1 text-center font-body font-semibold uppercase tracking-wide text-sm px-4 py-3 rounded-sm border-2 cursor-pointer transition-colors ${
                data.fulfillmentType === type
                  ? "bg-flame border-flame text-bone"
                  : "bg-transparent border-bone/20 text-bone/70 hover:border-bone/50"
              }`}
            >
              <input
                type="radio"
                name="fulfillmentType"
                value={type}
                checked={data.fulfillmentType === type}
                onChange={() => update("fulfillmentType", type)}
                className="sr-only"
              />
              {type}
            </label>
          ))}
        </div>

        {data.fulfillmentType === "collection" && (
          <p className="font-body text-bone/60 text-sm bg-smoke-light border border-bone/10 rounded-sm p-3">
            114 Bhala Street, Tsakane (ECentre), Gauteng
          </p>
        )}

        {data.fulfillmentType === "delivery" && (
          <div className="space-y-3">
            <p className="font-body text-char text-xs bg-char/10 border border-char/30 rounded-sm p-3">
              Delivery available. Please confirm delivery availability and delivery
              fee when ordering.
            </p>

            <div>
              <label htmlFor="deliveryAddress" className="block font-body text-sm text-bone/70 mb-1">
                Delivery Address
              </label>
              <input
                id="deliveryAddress"
                type="text"
                value={data.deliveryAddress}
                onChange={(e) => update("deliveryAddress", e.target.value)}
                aria-invalid={!!showError("deliveryAddress")}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
              />
              {showError("deliveryAddress") && (
                <p className="text-ember text-xs mt-1">{errors.deliveryAddress}</p>
              )}
            </div>

            <div>
              <label htmlFor="deliveryArea" className="block font-body text-sm text-bone/70 mb-1">
                Area
              </label>
              <input
                id="deliveryArea"
                type="text"
                value={data.deliveryArea}
                onChange={(e) => update("deliveryArea", e.target.value)}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
              />
            </div>

            <div>
              <label htmlFor="deliveryDirections" className="block font-body text-sm text-bone/70 mb-1">
                Additional Directions (optional)
              </label>
              <textarea
                id="deliveryDirections"
                value={data.deliveryDirections}
                onChange={(e) => update("deliveryDirections", e.target.value)}
                rows={2}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
              />
            </div>
          </div>
        )}
      </div>

      {/* Special instructions */}
      <div>
        <label htmlFor="specialInstructions" className="block font-body text-sm text-bone/70 mb-1">
          Special Instructions (optional)
        </label>
        <textarea
          id="specialInstructions"
          value={data.specialInstructions}
          onChange={(e) => update("specialInstructions", e.target.value)}
          rows={2}
          placeholder="Extra sauce, no onions, please call on arrival..."
          className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone placeholder:text-bone/30 focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full font-body font-bold text-lg uppercase tracking-wide bg-flame text-bone px-6 py-4 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
      >
        {submitting
          ? "Placing Order..."
          : !orderingOpen
          ? "Orders Closed"
          : "Place Order"}
      </button>
    </form>
  );
}
