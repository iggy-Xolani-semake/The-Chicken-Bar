"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { submitOrder, type SubmittedOrder } from "@/lib/supabase/submitOrder";
import { notifyRestaurant } from "@/lib/notifications/notifyRestaurant";
import { buildWhatsAppMessage, buildWhatsAppLink } from "@/lib/notifications/whatsapp";
import CheckoutForm, { type CheckoutData } from "@/app/components/CheckoutForm";

// Default order-notification WhatsApp number per brief. Should eventually
// read from restaurant_settings.whatsapp_orders_number (admin-editable)
// rather than this hardcoded fallback — flagging that here rather than
// treating this as final, same as the order-hours default in CheckoutForm.
const DEFAULT_ORDERS_WHATSAPP = "0658012302";

export default function CheckoutPage() {
  const { lines, subtotal, dispatch } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<SubmittedOrder | null>(null);

  async function handleSubmit(checkoutData: CheckoutData) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const order = await submitOrder(lines, checkoutData);

      // Notification failure should not block the customer from reaching
      // WhatsApp — the order is already safely saved at this point. Log
      // and continue rather than throw, since blocking here over an email
      // hiccup would be a worse customer experience than a missed email
      // the restaurant can't do anything about in the moment anyway.
      try {
        await notifyRestaurant(order);
      } catch (notifyErr) {
        console.error("Restaurant notification failed (order still saved):", notifyErr);
      }

      dispatch({ type: "CLEAR_CART" });
      setCompletedOrder(order);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completedOrder) {
    const message = buildWhatsAppMessage(
      completedOrder.orderNumber,
      completedOrder.lines,
      completedOrder.checkout,
      completedOrder.subtotal,
      completedOrder.deliveryFee
    );
    const whatsappLink = buildWhatsAppLink(DEFAULT_ORDERS_WHATSAPP, message);

    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Deliberately NOT a checkmark/"Order Received" — that combination
              reads as "you're done" when the order isn't actually placed
              with the restaurant until the WhatsApp step happens. An order
              row is saved at this point, but nothing has reached a human
              yet. The icon, heading, and body copy below all lead with
              "one step left" rather than burying it in small print after
              a false all-done signal. */}
          <div className="text-flame text-5xl" aria-hidden="true">
            💬
          </div>
          <h1 className="font-display text-bone text-4xl">One Step Left</h1>
          <p className="font-utility text-char text-lg">{completedOrder.orderNumber}</p>
          <p className="font-body text-bone/70">
            Your order details are saved — but it&apos;s not placed with us yet.
            Tap below to send it on WhatsApp with everything pre-filled. We
            only start preparing once it lands in our chat.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full font-body font-bold text-lg uppercase tracking-wide bg-flame text-bone px-6 py-4 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
          >
            Continue on WhatsApp
          </a>
          <p className="font-body text-bone/50 text-sm">
            Your order won&apos;t reach the kitchen until you send this message.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <h1 className="font-display text-bone text-4xl mb-8 text-center">Checkout</h1>

      {submitError && (
        <div role="alert" className="bg-ember/10 border border-ember/40 rounded-sm p-4 mb-6">
          <p className="font-body text-ember text-sm">{submitError}</p>
        </div>
      )}

      <CheckoutForm onSubmit={handleSubmit} submitting={submitting} />
    </main>
  );
}
