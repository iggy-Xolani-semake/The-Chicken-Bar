// Supabase Edge Function — sends order notification emails via Resend.
// The Resend API key lives ONLY as a Supabase secret (set via CLI or
// dashboard), never in frontend code, never in this file as a literal.
// Deploy with: supabase functions deploy send-order-email
// Set the secret with: supabase secrets set RESEND_API_KEY=<your-key>

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESTAURANT_EMAIL = "info.thechickenbar@gmail.com";

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
      to: RESTAURANT_EMAIL,
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
