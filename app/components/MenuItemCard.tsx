"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/supabase/types";
import { useCart } from "@/lib/cart/CartContext";
import type { ResolvedComboChoice, ResolvedAddon } from "@/lib/cart/cartLogic";
import ComboSelector from "./ComboSelector";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { dispatch } = useCart();
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showComboSelector, setShowComboSelector] = useState(false);
  const [checkedAddonIds, setCheckedAddonIds] = useState<string[]>([]);

  const isCombo = item.item_type === "combo" && item.combo_option_groups.length > 0;
  const availableAddons = item.menu_item_addons
    .filter((a) => a.is_available)
    .sort((a, b) => a.display_order - b.display_order);

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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url ?? undefined} alt={item.name} className="w-full h-40 object-cover" />
      )}

      {/* Compact single-line layout when there's no photo yet — a card
          with a large empty top half (same padding as an image card,
          minus the image) reads as broken, not minimal. This tightens
          automatically once a real image_url is set on the item, no
          separate code path needed later. */}
      {!hasImage && (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="font-body font-bold text-bone truncate">{item.name}</h3>
              {!item.is_available && (
                <span className="font-utility text-[10px] uppercase text-bone/50 border border-bone/20 px-1.5 py-0.5 rounded-sm shrink-0">
                  Out of Stock
                </span>
              )}
            </div>
            {isCombo && item.is_available && (
              <p className="font-utility text-char text-[11px] uppercase tracking-wide truncate">
                {item.combo_option_groups.map((g) => g.name).join(" · ")}
              </p>
            )}
            {item.menu_item_addons.length > 0 && item.is_available && (
              <p className="font-body text-bone/50 text-[11px] truncate">
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
