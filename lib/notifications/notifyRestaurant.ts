import { supabase } from "@/lib/supabase/client";
import type { SubmittedOrder } from "@/lib/supabase/submitOrder";
import { lineItemTotal } from "@/lib/cart/cartLogic";

/**
 * Single seam for restaurant order notifications. Now backed by the
 * send-order-email Supabase Edge Function (Resend under the hood).
 * The Resend API key lives only as an Edge Function secret — never in
 * this file, never in any frontend code. Called via supabase.functions.invoke,
 * which routes through Supabase's own auth, no key needed client-side.
 */
export async function notifyRestaurant(order: SubmittedOrder): Promise<void> {
  const itemsSummary = order.lines
    .map((line) => {
      const choiceSuffix =
        line.resolvedChoices.length > 0
          ? ` (${line.resolvedChoices.map((c) => c.choiceName).join(", ")})`
          : "";
      return `${line.quantity} x ${line.name}${choiceSuffix} - R${lineItemTotal(line).toFixed(0)}`;
    })
    .join("\n");

  const { error } = await supabase.functions.invoke("send-order-email", {
    body: {
      orderNumber: order.orderNumber,
      customerName: order.checkout.customerName,
      customerPhone: order.checkout.customerPhone,
      items: itemsSummary,
      total: `R${order.subtotal.toFixed(0)}`,
      fulfillmentType: order.checkout.fulfillmentType,
      deliveryAddress:
        order.checkout.fulfillmentType === "delivery" ? order.checkout.deliveryAddress : "N/A (Collection)",
      specialInstructions: order.checkout.specialInstructions || "None",
      orderTime: new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
    },
  });

  if (error) {
    // Order is already saved in the database at this point (submitOrder
    // runs before notifyRestaurant in checkout/page.tsx) — a failed
    // notification is bad but not catastrophic. Throwing lets the caller
    // decide how to handle it (checkout page currently logs and continues
    // to WhatsApp rather than blocking the customer).
    throw new Error(`Email notification failed: ${error.message}`);
  }
}
