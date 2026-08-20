import { createClient } from "@supabase/supabase-js";
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
    if (!subscriptions?.length) return Response.json({ delivered: 0, removed: 0 });

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

    return Response.json({
      delivered: results.filter((result) => result.delivered).length,
      removed: expiredEndpoints.length,
    });
  } catch (error) {
    console.error("Order push notification delivery failed", error);
    return Response.json({ error: "Unable to deliver order notifications" }, { status: 500 });
  }
}
