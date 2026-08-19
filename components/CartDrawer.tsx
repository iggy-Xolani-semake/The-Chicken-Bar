"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { lineItemTotal } from "@/lib/cart/cartLogic";

export default function CartDrawer() {
  const { lines, subtotal, dispatch } = useCart();
  const [open, setOpen] = useState(false);

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <>
      {/* Floating trigger button — always visible once anything is in cart,
          matches brief's "persistent order/cart drawer" requirement and
          "make ORDER the most prominent action" for mobile */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 bg-flame text-bone font-body font-bold rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.5)] px-6 py-4 items-center gap-2 hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
        >
          <span aria-hidden="true">🛒</span>
          <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
          <span className="font-utility">R{subtotal.toFixed(0)}</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Your order"
        >
          <div className="bg-smoke w-full sm:max-w-md h-full overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-bone/10 flex items-center justify-between">
              <h2 className="font-display text-bone text-2xl">Your Order</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="text-bone/60 hover:text-bone text-2xl leading-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 p-6">
              {lines.length === 0 ? (
                <p className="font-body text-bone/50 text-center mt-8">
                  Your order is empty.
                </p>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li
                      key={line.cartLineId}
                      className="flex items-start justify-between gap-3 pb-4 border-b border-bone/10"
                    >
                      <div className="flex-1">
                        <p className="font-body font-semibold text-bone">
                          {line.quantity} &times; {line.name}
                        </p>
                        {line.resolvedChoices.length > 0 && (
                          <p className="font-body text-bone/50 text-sm">
                            {line.resolvedChoices.map((c) => c.choiceName).join(", ")}
                          </p>
                        )}
                        {line.selectedAddons.length > 0 && (
                          <p className="font-body text-bone/50 text-sm">
                            + {line.selectedAddons.map((a) => a.name).join(", ")}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({ type: "REMOVE_LINE", payload: { cartLineId: line.cartLineId } })
                          }
                          className="font-body text-ember text-xs mt-1 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="font-utility text-bone shrink-0">
                        R{lineItemTotal(line).toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="p-6 border-t border-bone/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body font-bold text-bone text-lg">Order Total</span>
                  <span className="font-utility text-flame text-2xl font-bold">
                    R{subtotal.toFixed(0)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center font-body font-bold text-lg uppercase tracking-wide bg-flame text-bone px-6 py-4 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
                >
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
