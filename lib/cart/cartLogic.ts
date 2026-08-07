import type { MenuItem } from "@/lib/supabase/types";

/**
 * A single resolved choice within a combo — which option was picked from
 * which group. Snapshotted at add-to-cart time so later menu edits don't
 * retroactively change what's in someone's cart mid-order.
 */
export interface ResolvedComboChoice {
  optionGroupId: string;
  optionGroupName: string;
  choiceId: string;
  choiceName: string;
  priceDelta: number;
}

/**
 * A selected paid extra (e.g. Cheese Slice +R3, Special +R5) from
 * menu_item_addons. Snapshotted the same way as ResolvedComboChoice —
 * name + price captured at add-to-cart time, so a later admin price
 * change doesn't silently alter an order already sitting in someone's
 * cart. Unlike combo choices, addons are NOT mutually exclusive and
 * have no min/max group — any subset (including none) is valid.
 */
export interface ResolvedAddon {
  addonId: string;
  name: string;
  price: number;
}

/**
 * A line item in the cart. Mirrors what will eventually become an
 * order_items row (+ order_item_choices rows for combos) at checkout.
 */
export interface CartLineItem {
  cartLineId: string; // client-generated, unique per line — NOT the menu_item id,
                       // since the same menu item can appear as two lines with
                       // different combo choices (e.g. one Meat Combo with Ribs,
                       // another with Chicken)
  menuItemId: string;
  name: string;
  unitPrice: number; // base price, NOT including combo choice price_deltas
  quantity: number;
  resolvedChoices: ResolvedComboChoice[]; // empty array for simple items
  selectedAddons: ResolvedAddon[]; // empty array if no extras chosen
  itemNotes: string;
}

export interface CartState {
  lines: CartLineItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartLineItem, "cartLineId"> }
  | { type: "REMOVE_LINE"; payload: { cartLineId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { cartLineId: string; quantity: number } }
  | { type: "UPDATE_NOTES"; payload: { cartLineId: string; notes: string } }
  | { type: "UPDATE_ADDONS"; payload: { cartLineId: string; addons: ResolvedAddon[] } }
  | { type: "CLEAR_CART" };

/**
 * Computes the true per-line total: (unitPrice + sum of choice price_deltas
 * + sum of selected addon prices) * quantity. Combo choices can carry a
 * price_delta (e.g. "+R20 for ribs upgrade") per the schema's
 * combo_option_choices.price_delta column — most combos in this project's
 * real menu data have delta=0 across all choices, but the schema supports
 * it and this calculation must account for it correctly regardless.
 * Addons (e.g. Cheese Slice +R3) are always additive, no delta concept —
 * each selected addon's full price is added once per unit of the line.
 */
export function lineItemTotal(line: CartLineItem): number {
  const choiceDeltaSum = line.resolvedChoices.reduce(
    (sum, choice) => sum + choice.priceDelta,
    0
  );
  const addonSum = line.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  return (line.unitPrice + choiceDeltaSum + addonSum) * line.quantity;
}

export function cartSubtotal(lines: CartLineItem[]): number {
  return lines.reduce((sum, line) => sum + lineItemTotal(line), 0);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const cartLineId = `${action.payload.menuItemId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      return {
        lines: [...state.lines, { ...action.payload, cartLineId }],
      };
    }
    case "REMOVE_LINE":
      return {
        lines: state.lines.filter((l) => l.cartLineId !== action.payload.cartLineId),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity < 1) {
        // quantity dropping below 1 removes the line entirely rather than
        // allowing a 0-quantity ghost line to sit in the cart
        return {
          lines: state.lines.filter((l) => l.cartLineId !== action.payload.cartLineId),
        };
      }
      return {
        lines: state.lines.map((l) =>
          l.cartLineId === action.payload.cartLineId
            ? { ...l, quantity: action.payload.quantity }
            : l
        ),
      };
    case "UPDATE_NOTES":
      return {
        lines: state.lines.map((l) =>
          l.cartLineId === action.payload.cartLineId
            ? { ...l, itemNotes: action.payload.notes }
            : l
        ),
      };
    case "UPDATE_ADDONS":
      return {
        lines: state.lines.map((l) =>
          l.cartLineId === action.payload.cartLineId
            ? { ...l, selectedAddons: action.payload.addons }
            : l
        ),
      };
    case "CLEAR_CART":
      return { lines: [] };
    default:
      return state;
  }
}

/**
 * Validates whether a menu item, given a set of tentatively-resolved combo
 * choices, is actually eligible to be added to the cart. This is the gate
 * the brief requires: a combo cannot be added until every required option
 * group has a valid selection satisfying its min_select/max_select bounds.
 *
 * For simple items (item_type = 'simple'), this always returns valid — no
 * choices to resolve.
 */
export function validateComboSelection(
  item: MenuItem,
  selections: Record<string, string[]> // optionGroupId -> array of selected choiceIds
): { valid: boolean; missingGroups: string[] } {
  if (item.item_type === "simple" || item.combo_option_groups.length === 0) {
    return { valid: true, missingGroups: [] };
  }

  const missingGroups: string[] = [];

  for (const group of item.combo_option_groups) {
    const selectedForGroup = selections[group.id] ?? [];
    if (
      selectedForGroup.length < group.min_select ||
      selectedForGroup.length > group.max_select
    ) {
      missingGroups.push(group.name);
    }
  }

  return { valid: missingGroups.length === 0, missingGroups };
}
