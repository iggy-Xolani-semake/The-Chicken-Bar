import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRecord = {
  id?: string;
  order_number?: string;
  total?: number | string;
};

type OrderWebhookPayload = {
  type?: string;
  table?: string;
  record?: OrderRecord;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type DeliveryStatus = "delivered" | "warning" | "failed" | "no_subscriptions";
type EmailAlertStatus = "not_requested" | "sent" | "failed" | "not_configured";

type DeliveryLogInput = {
  order: OrderRecord;
  registeredSubscriptions: number;
  deliveredCount: number;
  failedCount: number;
  expiredRemovedCount: number;
  status: DeliveryStatus;
  failureSummary: string | null;
  emailAlertStatus: EmailAlertStatus;
  emailAlertError: string | null;
};

function isWebhookRequestAuthorized(request: Request, expectedSecret: string): boolean {
  const providedSecret = request.headers.get("x-order-webhook-secret");
  return Boolean(providedSecret && providedSecret === expectedSecret);
}

function isExpiredSubscriptionError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return false;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return statusCode === 404 || statusCode === 410;
}

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getOptionalEnvironment(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function isUuid(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

async function recordDeliveryLog(supabase: SupabaseClient, input: DeliveryLogInput) {
  const { error } = await supabase.from("push_delivery_logs").insert({
    order_id: isUuid(input.order.id) ? input.order.id : null,
    order_number: input.order.order_number ?? null,
    registered_subscriptions: input.registeredSubscriptions,
    delivered_count: input.deliveredCount,
    failed_count: input.failedCount,
    expired_removed_count: input.expiredRemovedCount,
    status: input.status,
    failure_summary: input.failureSummary,
    email_alert_status: input.emailAlertStatus,
    email_alert_error: input.emailAlertError,
  });

  if (error) {
    // Monitoring must never block a valid order notification from returning.
    console.error("Unable to record order push delivery health", error);
  }
}

async function sendCriticalFailureEmail(input: {
  order: OrderRecord;
  registeredSubscriptions: number;
  deliveredCount: number;
  failedCount: number;
  summary: string;
}): Promise<{ status: EmailAlertStatus; error: string | null }> {
  const apiKey = getOptionalEnvironment("RESEND_API_KEY");
  const from = getOptionalEnvironment("PUSH_FAILURE_ALERT_FROM_EMAIL");
  const to = getOptionalEnvironment("PUSH_FAILURE_ALERT_EMAIL");

  if (!apiKey || !from || !to) {
    return { status: "not_configured", error: "Critical alert email is not configured." };
  }

  const orderReference = input.order.order_number?.trim() || input.order.id?.trim() || "unknown order";
  const subject = `Chicken Bar alert: order push notification failed`;
  const safeOrderReference = escapeHtml(orderReference);
  const safeSummary = escapeHtml(input.summary);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `chicken-bar-push-failure-${orderReference}`.slice(0, 256),
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: [
          "Chicken Bar order notification alert",
          `Order: ${orderReference}`,
          input.summary,
          `Registered devices: ${input.registeredSubscriptions}`,
          `Delivered: ${input.deliveredCount}`,
          `Failed: ${input.failedCount}`,
          "Open the private Admin Notification Health page to review the delivery record.",
        ].join("\n"),
        html: `<h2>Chicken Bar order notification alert</h2><p><strong>Order:</strong> ${safeOrderReference}</p><p>${safeSummary}</p><ul><li>Registered devices: ${input.registeredSubscriptions}</li><li>Delivered: ${input.deliveredCount}</li><li>Failed: ${input.failedCount}</li></ul><p>Open the private Admin Notification Health page to review the delivery record.</p>`,
      }),
    });

    if (!response.ok) {
      console.error("Unable to send critical order push failure email", await response.text());
      return { status: "failed", error: `Email service returned HTTP ${response.status}.` };
    }

    return { status: "sent", error: null };
  } catch (error) {
    console.error("Unable to send critical order push failure email", error);
    return { status: "failed", error: "Email service request could not be completed." };
  }
}

export async function POST(request: Request) {
  try {
    const webhookSecret = getRequiredEnvironment("ORDER_PUSH_WEBHOOK_SECRET");
    if (!isWebhookRequestAuthorized(request, webhookSecret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as OrderWebhookPayload;
    if (payload.type && payload.type !== "INSERT") {
      return Response.json({ ignored: true });
    }
    if (payload.table && payload.table !== "orders") {
      return Response.json({ ignored: true });
    }

    const order = payload.record;
    if (!order) {
      return Response.json({ error: "Missing order record" }, { status: 400 });
    }

    const supabase = createClient(
      getRequiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .limit(1000);

    if (subscriptionError) throw subscriptionError;

    const registeredSubscriptions = subscriptions?.length ?? 0;
    if (registeredSubscriptions === 0) {
      const failureSummary = "No admin device is registered for order notifications.";
      const email = await sendCriticalFailureEmail({
        order,
        registeredSubscriptions,
        deliveredCount: 0,
        failedCount: 0,
        summary: failureSummary,
      });

      await recordDeliveryLog(supabase, {
        order,
        registeredSubscriptions,
        deliveredCount: 0,
        failedCount: 0,
        expiredRemovedCount: 0,
        status: "no_subscriptions",
        failureSummary,
        emailAlertStatus: email.status,
        emailAlertError: email.error,
      });

      return Response.json({ delivered: 0, removed: 0, failed: 0 });
    }

    webpush.setVapidDetails(
      getRequiredEnvironment("VAPID_SUBJECT"),
      getRequiredEnvironment("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
      getRequiredEnvironment("VAPID_PRIVATE_KEY")
    );

    const orderNumber = order.order_number ? ` ${order.order_number}` : "";
    const total = order.total === undefined || order.total === null ? null : Number(order.total);
    const body = Number.isFinite(total) ? `Order${orderNumber} · R${total?.toFixed(2)}` : `Order${orderNumber} has arrived.`;
    const notification = JSON.stringify({
      title: "New Order!",
      body,
      tag: order.id ? `chicken-bar-order-${order.id}` : "chicken-bar-new-order",
      url: "/admin/orders",
    });

    const results = await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            notification,
            { TTL: 60 }
          );
          return { delivered: true, expiredEndpoint: null as string | null };
        } catch (error) {
          if (!isExpiredSubscriptionError(error)) {
            console.error("Unable to send a push notification", error);
          }
          return {
            delivered: false,
            expiredEndpoint: isExpiredSubscriptionError(error) ? subscription.endpoint : null,
          };
        }
      })
    );

    const expiredEndpoints = results.flatMap((result) => (result.expiredEndpoint ? [result.expiredEndpoint] : []));
    if (expiredEndpoints.length > 0) {
      const { error: deleteError } = await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
      if (deleteError) throw deleteError;
    }

    const deliveredCount = results.filter((result) => result.delivered).length;
    const failedCount = results.length - deliveredCount;
    const status: DeliveryStatus = deliveredCount === 0 ? "failed" : failedCount > 0 ? "warning" : "delivered";
    const failureSummary =
      status === "failed"
        ? "No registered admin device accepted this order notification."
        : status === "warning"
          ? `${failedCount} registered device notification${failedCount === 1 ? "" : "s"} could not be delivered.`
          : null;

    const email =
      status === "failed"
        ? await sendCriticalFailureEmail({
            order,
            registeredSubscriptions,
            deliveredCount,
            failedCount,
            summary: failureSummary ?? "Order notification failed.",
          })
        : { status: "not_requested" as const, error: null };

    await recordDeliveryLog(supabase, {
      order,
      registeredSubscriptions,
      deliveredCount,
      failedCount,
      expiredRemovedCount: expiredEndpoints.length,
      status,
      failureSummary,
      emailAlertStatus: email.status,
      emailAlertError: email.error,
    });

    return Response.json({
      delivered: deliveredCount,
      removed: expiredEndpoints.length,
      failed: failedCount,
    });
  } catch (error) {
    console.error("Order push notification delivery failed", error);
    return Response.json({ error: "Unable to deliver order notifications" }, { status: 500 });
  }
}
