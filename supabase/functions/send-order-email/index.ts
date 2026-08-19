// Supabase Edge Function — sends order notification emails via Resend.
// The Resend API key lives ONLY as a Supabase secret (set via CLI or
// dashboard), never in frontend code, never in this file as a literal.
// Deploy with: supabase functions deploy send-order-email
// Set the secret with: supabase secrets set RESEND_API_KEY=<your-key>

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Fallback only — used if restaurant_settings has no row yet, or the
// email field is blank. Keeps order notifications working even if
// Settings is ever misconfigured, rather than failing every order.
const FALLBACK_RESTAURANT_EMAIL = "info.thechickenbar@gmail.com";

/**
 * Looks up the current notification email from restaurant_settings,
 * read fresh on every request (not cached) so changing it in
 * /admin/settings takes effect on the very next order — no redeploy
 * needed. Uses the service role key, set automatically by Supabase for
 * every Edge Function, so this works regardless of RLS policies on
 * restaurant_settings.
 */
async function getRestaurantEmail(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase URL/service role key not available to Edge Function");
    return FALLBACK_RESTAURANT_EMAIL;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("email")
    .single();

  if (error || !data?.email) {
    console.error("Could not read restaurant_settings.email, using fallback:", error?.message);
    return FALLBACK_RESTAURANT_EMAIL;
  }

  return data.email;
}

interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: string; // pre-formatted multi-line item summary
  total: string;
  fulfillmentType: string;
  deliveryAddress: string;
  specialInstructions: string;
  orderTime: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY secret is not set on this Edge Function");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let payload: OrderEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const restaurantEmail = await getRestaurantEmail();

  const html = `
    <h2>NEW CHICKEN BAR ORDER — ${payload.orderNumber}</h2>
    <p><strong>Customer:</strong> ${payload.customerName}</p>
    <p><strong>Phone:</strong> ${payload.customerPhone}</p>
    <p><strong>Order:</strong></p>
    <pre>${payload.items}</pre>
    <p><strong>Total:</strong> ${payload.total}</p>
    <p><strong>Type:</strong> ${payload.fulfillmentType}</p>
    <p><strong>Delivery Address:</strong> ${payload.deliveryAddress}</p>
    <p><strong>Special Instructions:</strong> ${payload.specialInstructions}</p>
    <p><strong>Order Time:</strong> ${payload.orderTime}</p>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "The Chicken Bar Orders <orders@resend.dev>", // swap to a verified domain sender once one is set up in Resend
      to: restaurantEmail,
      subject: `NEW CHICKEN BAR ORDER — ${payload.orderNumber}`,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const errBody = await resendResponse.text();
    console.error("Resend API error:", errBody);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
