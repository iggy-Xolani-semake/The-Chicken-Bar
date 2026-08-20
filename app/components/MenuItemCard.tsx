"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuItem } from "@/lib/supabase/types";
import { useCart } from "@/lib/cart/CartContext";
import type { ResolvedComboChoice, ResolvedAddon } from "@/lib/cart/cartLogic";
import { lineItemTotal } from "@/lib/cart/cartLogic";
import ComboSelector from "./ComboSelector";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { lines, dispatch } = useCart();
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showComboSelector, setShowComboSelector] = useState(false);
  const [checkedAddonIds, setCheckedAddonIds] = useState<string[]>([]);

  const isCombo = item.item_type === "combo" && item.combo_option_groups.length > 0;
  const availableAddons = item.menu_item_addons
    .filter((a) => a.is_available)
    .sort((a, b) => a.display_order - b.display_order);

  // Real fix for a real complaint: previously, adding an item reset the
  // card back to its default state with zero memory that anything was
  // added — a customer changing their mind had to go find it in the cart
  // drawer/orders page to remove it, which is a real hassle. This reads
  // the live cart and shows every line for THIS item directly on its own
  // card, with the same +/- controls plus a remove button, so changes
  // happen right where the customer is already looking.
  //
  // Deliberately an array, not a single line: the same menu item can
  // appear as multiple separate cart lines with different combo choices
  // or addons (see cartLineId comment in cartLogic.ts) — merging them
  // into one count would hide real distinctions between orders.
  const cartLinesForThisItem = lines.filter((l) => l.menuItemId === item.id);

  function toggleAddon(addonId: string) {
    setCheckedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  function resolveCheckedAddons(): ResolvedAddon[] {
    return availableAddons
      .filter((a) => checkedAddonIds.includes(a.id))
      .map((a) => ({ addonId: a.id, name: a.name, price: a.price }));
  }

  function handleAddToOrderClick() {
    if (!item.is_available) return; // brief requirement: unavailable items cannot be added

    if (isCombo) {
      setShowComboSelector(true);
      return;
    }

    // simple item — toggle selection per brief's explicit click-doesn't-add
    // requirement. First click selects (shows quantity), it does NOT add
    // to cart yet. Cart add happens via the separate quantity-confirmed flow.
    setSelected((prev) => !prev);
  }

  function confirmSimpleAdd() {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity,
        resolvedChoices: [],
        selectedAddons: resolveCheckedAddons(),
        itemNotes: "",
      },
    });
    setSelected(false);
    setQuantity(1);
    setCheckedAddonIds([]);
  }

  function handleComboConfirm(resolvedChoices: ResolvedComboChoice[]) {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: 1,
        resolvedChoices,
        selectedAddons: resolveCheckedAddons(),
        itemNotes: "",
      },
    });
    setShowComboSelector(false);
    setCheckedAddonIds([]);
  }

  function updateLineQuantity(cartLineId: string, quantity: number) {
    if (quantity < 1) {
      dispatch({ type: "REMOVE_LINE", payload: { cartLineId } });
      return;
    }
    dispatch({ type: "UPDATE_QUANTITY", payload: { cartLineId, quantity } });
  }

  const hasImage = !!item.image_url;

  return (
    <div
      className={`bg-smoke-light border rounded-sm transition-colors overflow-hidden ${
        item.is_available
          ? "border-bone/10 hover:border-flame/60"
          : "border-bone/5 opacity-50"
      } ${hasImage ? "flex flex-col" : "flex flex-wrap items-center justify-between gap-3 px-4 py-3"}`}
    >
      {hasImage && (
        <div className="relative w-full h-40">
          <Image
            src={item.image_url as string}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Compact single-line layout when there's no photo yet — a card
          with a large empty top half (same padding as an image card,
          minus the image) reads as broken, not minimal. This tightens
          automatically once a real image_url is set on the item, no
          separate code path needed later. */}
      {!hasImage && (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-body font-bold text-bone break-words">{item.name}</h3>
              {!item.is_available && (
                <span className="font-utility text-[10px] uppercase text-bone/50 border border-bone/20 px-1.5 py-0.5 rounded-sm shrink-0">
                  Out of Stock
                </span>
              )}
            </div>
            {isCombo && item.is_available && (
              <p className="font-utility text-char text-[11px] uppercase tracking-wide break-words">
                {item.combo_option_groups.map((g) => g.name).join(" · ")}
              </p>
            )}
            {item.menu_item_addons.length > 0 && item.is_available && (
              <p className="font-body text-bone/50 text-[11px] break-words">
                Extras:{" "}
                {item.menu_item_addons
                  .filter((a) => a.is_available)
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((a) => `${a.name} +R${a.price}`)
                  .join(" · ")}
              </p>
            )}
          </div>
          <span className="font-utility text-flame font-bold shrink-0">R{item.price}</span>
          {!selected && (
            <button
              type="button"
              onClick={handleAddToOrderClick}
              disabled={!item.is_available}
              className="font-body font-semibold text-xs uppercase tracking-wide bg-flame text-bone px-3 py-2 rounded-sm hover:bg-ember transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
            >
              {item.is_available ? "Add" : "N/A"}
            </button>
          )}
          {selected && !isCombo && availableAddons.length > 0 && (
            <div className="basis-full flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {availableAddons.map((addon) => (
                <label
                  key={addon.id}
                  className="flex items-center gap-1 font-body text-bone/70 text-[11px] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedAddonIds.includes(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="w-3 h-3 accent-flame"
                  />
                  {addon.name} +R{addon.price}
                </label>
              ))}
            </div>
          )}
          {selected && !isCombo && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-6 h-6 flex items-center justify-center rounded-sm border border-bone/20 text-bone text-sm"
              >
                &minus;
              </button>
              <span className="font-utility text-bone text-sm w-4 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-6 h-6 flex items-center justify-center rounded-sm border border-bone/20 text-bone text-sm"
              >
                +
              </button>
              <button
                type="button"
                onClick={confirmSimpleAdd}
                className="font-body font-semibold text-xs uppercase bg-flame text-bone px-2.5 py-1.5 rounded-sm"
              >
                OK
              </button>
            </div>
          )}
          {cartLinesForThisItem.length > 0 && (
            <div className="basis-full flex flex-col gap-1.5 pt-2 mt-1 border-t border-flame/20">
              {cartLinesForThisItem.map((line) => (
                <div key={line.cartLineId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-flame text-[11px] font-semibold break-words">
                      In your order
                      {line.resolvedChoices.length > 0 &&
                        ` — ${line.resolvedChoices.map((c) => c.choiceName).join(", ")}`}
                      {line.selectedAddons.length > 0 &&
                        ` + ${line.selectedAddons.map((a) => a.name).join(", ")}`}
                    </p>
                    <p className="font-utility text-bone/50 text-[10px]">
                      R{lineItemTotal(line).toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.cartLineId, line.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 flex items-center justify-center rounded-sm border border-bone/20 text-bone text-sm"
                    >
                      &minus;
                    </button>
                    <span className="font-utility text-bone text-sm w-4 text-center">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateLineQuantity(line.cartLineId, line.quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 flex items-center justify-center rounded-sm border border-bone/20 text-bone text-sm"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_LINE", payload: { cartLineId: line.cartLineId } })}
                      aria-label="Remove from order"
                      className="font-body text-[10px] uppercase text-bone/50 hover:text-flame underline ml-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {hasImage && (
      <div className="p-6 flex flex-col justify-between flex-1">
      <div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-body font-bold text-bone text-xl leading-tight">
            {item.name}
          </h3>
          {!item.is_available && (
            <span className="font-utility text-xs uppercase tracking-wide text-bone/50 border border-bone/20 px-2 py-1 rounded-sm shrink-0">
              Out of Stock
            </span>
          )}
        </div>

        {item.contents_description && (
          <p className="font-body text-bone/60 text-sm mb-1">
            {item.contents_confirmed
              ? item.contents_description
              : "Contents to be confirmed — ask us for details"}
          </p>
        )}

        {isCombo && item.is_available && (
          <p className="font-utility text-char text-xs uppercase tracking-wide mb-3">
            {item.combo_option_groups.map((g) => g.name).join(" · ")}
          </p>
        )}

        {item.menu_item_addons.length > 0 && item.is_available && (
          <p className="font-body text-bone/50 text-xs mb-3">
            Extras:{" "}
            {item.menu_item_addons
              .filter((a) => a.is_available)
              .sort((a, b) => a.display_order - b.display_order)
              .map((a) => `${a.name} +R${a.price}`)
              .join(" · ")}
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-utility text-flame text-2xl font-bold">
            R{item.price}
          </span>

          {!selected && (
            <button
              type="button"
              onClick={handleAddToOrderClick}
              disabled={!item.is_available}
              className="font-body font-semibold text-sm uppercase tracking-wide bg-flame text-bone px-5 py-2.5 rounded-sm hover:bg-ember transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-flame focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
            >
              {item.is_available ? "Add to order" : "Unavailable"}
            </button>
          )}

          {selected && !isCombo && (
            <span className="font-body font-semibold text-sm uppercase tracking-wide text-flame flex items-center gap-1">
              Selected <span aria-hidden="true">✓</span>
            </span>
          )}
        </div>

        {/* addon checkboxes — only appears after a simple item is selected
            and it has real extras available (kota extras, etc). Selecting
            one adds its full price to this line, per lineItemTotal in
            cartLogic.ts. */}
        {selected && !isCombo && availableAddons.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 pb-1">
            {availableAddons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center gap-1.5 font-body text-bone/70 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checkedAddonIds.includes(addon.id)}
                  onChange={() => toggleAddon(addon.id)}
                  className="w-3.5 h-3.5 accent-flame"
                />
                {addon.name} +R{addon.price}
              </label>
            ))}
          </div>
        )}

        {/* quantity stepper — only appears after a simple item is selected,
            per brief's explicit sequencing requirement */}
        {selected && !isCombo && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-bone/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
              >
                &minus;
              </button>
              <span className="font-utility text-bone w-6 text-center" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={confirmSimpleAdd}
              className="font-body font-semibold text-sm uppercase tracking-wide bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
            >
              Confirm
            </button>
          </div>
        )}
        {cartLinesForThisItem.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-flame/20">
            {cartLinesForThisItem.map((line) => (
              <div key={line.cartLineId} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-flame text-sm font-semibold">
                    In your order
                    {line.resolvedChoices.length > 0 &&
                      ` — ${line.resolvedChoices.map((c) => c.choiceName).join(", ")}`}
                    {line.selectedAddons.length > 0 &&
                      ` + ${line.selectedAddons.map((a) => a.name).join(", ")}`}
                  </p>
                  <p className="font-utility text-bone/50 text-xs">
                    R{lineItemTotal(line).toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateLineQuantity(line.cartLineId, line.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
                  >
                    &minus;
                  </button>
                  <span className="font-utility text-bone w-5 text-center text-sm" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateLineQuantity(line.cartLineId, line.quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-bone/20 text-bone hover:border-bone/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_LINE", payload: { cartLineId: line.cartLineId } })}
                    aria-label="Remove from order"
                    className="font-body text-xs uppercase text-bone/50 hover:text-flame underline ml-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}

      {showComboSelector && (
        <ComboSelector
          item={item}
          onConfirm={handleComboConfirm}
          onCancel={() => setShowComboSelector(false)}
        />
      )}
    </div>
  );
}
