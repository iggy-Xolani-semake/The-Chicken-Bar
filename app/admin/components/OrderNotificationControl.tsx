"use client";

import { useState } from "react";
import { getCurrentAdminStatus } from "@/lib/supabase/adminAuth";
import { supabase } from "@/lib/supabase/client";

type NotificationState = "idle" | "working" | "enabled" | "denied" | "unsupported" | "error";

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export default function OrderNotificationControl() {
  const [state, setState] = useState<NotificationState>("idle");
  const [message, setMessage] = useState("Enable notifications on this device to receive new-order alerts.");

  async function enableNotifications() {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setState("error");
      setMessage("Notifications are not configured on the server yet. Add the VAPID public key and deploy again.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      setMessage("This browser does not support push notifications. Use Chrome on Android for the best experience.");
      return;
    }

    setState("working");
    setMessage("Requesting notification permission…");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState("denied");
      setMessage("Notifications are blocked. Open your browser settings for this site and allow notifications, then try again.");
      return;
    }

    try {
      const { isAdmin, userId } = await getCurrentAdminStatus();
      if (!isAdmin || !userId) {
        throw new Error("Your admin session has expired. Please sign in again before enabling notifications.");
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const subscriptionJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        throw new Error("The browser returned an incomplete push subscription. Please try again.");
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw new Error(error.message);

      setState("enabled");
      setMessage("Order notifications are enabled on this device.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not enable notifications. Please try again.");
    }
  }

  const isWorking = state === "working";
  const isEnabled = state === "enabled";

  return (
    <section className="bg-smoke-light border border-bone/10 rounded-sm p-5 mb-8">
      <h2 className="font-display text-bone text-xl mb-2">Order Notifications</h2>
      <p className="font-body text-bone/60 text-sm mb-4">{message}</p>
      <button
        type="button"
        onClick={enableNotifications}
        disabled={isWorking || isEnabled}
        className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isWorking ? "Enabling…" : isEnabled ? "Notifications Enabled" : "Enable Order Notifications"}
      </button>
    </section>
  );
}
