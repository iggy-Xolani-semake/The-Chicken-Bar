import { supabase } from "./client";
import { generateOrderNumber } from "@/lib/orders/orderNumber";
import type { CartLineItem } from "@/lib/cart/cartLogic";
import { cartSubtotal } from "@/lib/cart/cartLogic";
import type { CheckoutData } from "@/app/components/CheckoutForm";

export interface SubmittedOrder {
  orderNumber: string;
  orderId: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  lines: CartLineItem[];
  checkout: CheckoutData;
}

/**
 * Submits a complete order via the submit_order() Postgres function
 * (see schema/08_atomic_order_submission.sql), which wraps the orders +
 * order_items + order_item_choices inserts in a single transaction.
 * This replaces an earlier multi-step client-side insert sequence that
 * had a real partial-failure gap — a network hiccup mid-sequence could
 * leave a broken "phantom" order with a real order_number and no items.
 * The atomic function eliminates that: it either fully commits or fully
 * rolls back, with no partial state possible.
 */
export async function submitOrder(
  lines: CartLineItem[],
  checkout: CheckoutData
): Promise<SubmittedOrder> {
  const orderNumber = await generateOrderNumber();
  const subtotal = cartSubtotal(lines);

  // Delivery fee: only applied for delivery orders, and only if the
  // admin has actually configured one in Restaurant Settings. If unset,
  // behaves exactly as the original brief specified — no fee charged
  // here, confirmed with the customer over WhatsApp instead.
  let deliveryFee = 0;
  if (checkout.fulfillmentType === "delivery") {
    const { data: settingsRow } = await supabase
      .from("restaurant_settings")
      .select("delivery_fee")
      .single();
    deliveryFee = settingsRow?.delivery_fee ?? 0;
  }

  const total = subtotal + deliveryFee;

  const lineItemsPayload = lines.map((line) => ({
    menu_item_id: line.menuItemId,
    item_name: line.name,
    unit_price: line.unitPrice,
    quantity: line.quantity,
    line_total:
      (line.unitPrice +
        line.resolvedChoices.reduce((s, c) => s + c.priceDelta, 0) +
        line.selectedAddons.reduce((s, a) => s + a.price, 0)) *
      line.quantity,
    item_notes: line.itemNotes || null,
    choices: line.resolvedChoices.map((c) => ({
      group_name: c.optionGroupName,
      choice_name: c.choiceName,
      price_delta: c.priceDelta,
    })),
    addons: line.selectedAddons.map((a) => ({
      addon_name: a.name,
      price: a.price,
    })),
  }));

  const { data: orderId, error } = await supabase.rpc("submit_order", {
    p_order_number: orderNumber,
    p_customer_name: checkout.customerName.trim(),
    p_customer_phone: checkout.customerPhone.trim(),
    p_fulfillment_type: checkout.fulfillmentType,
    p_delivery_address: checkout.fulfillmentType === "delivery" ? checkout.deliveryAddress.trim() : null,
    p_delivery_area: checkout.fulfillmentType === "delivery" ? checkout.deliveryArea.trim() : null,
    p_delivery_directions:
      checkout.fulfillmentType === "delivery" ? checkout.deliveryDirections.trim() : null,
    p_special_instructions: checkout.specialInstructions.trim() || null,
    p_subtotal: subtotal,
    p_total: total,
    p_line_items: lineItemsPayload,
    p_delivery_fee: deliveryFee,
  });

  if (error || !orderId) {
    throw new Error(`Failed to submit order: ${error?.message ?? "unknown error"}`);
  }

  return {
    orderNumber,
    orderId,
    subtotal,
    deliveryFee,
    total,
    lines,
    checkout,
  };
}
