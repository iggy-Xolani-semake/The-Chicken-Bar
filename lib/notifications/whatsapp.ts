import type { CartLineItem } from "@/lib/cart/cartLogic";
import { lineItemTotal } from "@/lib/cart/cartLogic";
import type { CheckoutData } from "@/app/components/CheckoutForm";

/**
 * Builds the pre-filled WhatsApp message per the brief's exact example
 * format. Two hard constraints from the brief, both honored here:
 * - Never say the customer has paid
 * - Never say the order is confirmed
 * WhatsApp is for restaurant confirmation/payment arrangement, not a
 * receipt of a completed transaction.
 */
export function buildWhatsAppMessage(
  orderNumber: string,
  lines: CartLineItem[],
  checkout: CheckoutData,
  subtotal: number,
  deliveryFee: number = 0
): string {
  const itemLines = lines
    .map((line) => {
      const choiceSuffix =
        line.resolvedChoices.length > 0
          ? ` (${line.resolvedChoices.map((c) => c.choiceName).join(", ")})`
          : "";
      const addonSuffix =
        line.selectedAddons.length > 0
          ? ` + ${line.selectedAddons.map((a) => a.name).join(", ")}`
          : "";
      return `${line.quantity} x ${line.name}${choiceSuffix}${addonSuffix} - R${lineItemTotal(line).toFixed(0)}`;
    })
    .join("\n");

  const parts = [
    "Hello The Chicken Bar 👋",
    "",
    `I would like to place order ${orderNumber}.`,
    "",
    "ORDER:",
    "",
    itemLines,
    "",
    "SUBTOTAL:",
    `R${subtotal.toFixed(0)}`,
  ];

  if (deliveryFee > 0) {
    parts.push("", "DELIVERY FEE:", `R${deliveryFee.toFixed(0)}`);
  }

  parts.push(
    "",
    "TOTAL:",
    `R${(subtotal + deliveryFee).toFixed(0)}`,
    "",
    "ORDER TYPE:",
    checkout.fulfillmentType === "collection" ? "Collection" : "Delivery"
  );

  if (checkout.fulfillmentType === "delivery") {
    parts.push("", "DELIVERY ADDRESS:", checkout.deliveryAddress);
    if (checkout.deliveryArea) parts.push(checkout.deliveryArea);
  }

  parts.push("", "NAME:", checkout.customerName, "", "PHONE:", checkout.customerPhone);

  if (checkout.specialInstructions.trim()) {
    parts.push("", "SPECIAL INSTRUCTIONS:", checkout.specialInstructions.trim());
  }

  parts.push("", "Please confirm my order.");

  return parts.join("\n");
}

/**
 * Builds the actual wa.me deep-link URL. Takes the target phone number
 * as a parameter rather than hardcoding it — per brief, the owner
 * configures which WhatsApp number receives orders vs events vs stalls
 * from admin settings, never hardcoded across components.
 */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  // wa.me requires digits only, no spaces/dashes/plus signs, with country code
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  // South African numbers starting with 0 need the 0 replaced with 27
  // (country code) for wa.me links to resolve correctly
  const withCountryCode = digitsOnly.startsWith("0") ? `27${digitsOnly.slice(1)}` : digitsOnly;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
