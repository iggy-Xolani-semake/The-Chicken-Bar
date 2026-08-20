"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type DeliveryStatus = "delivered" | "warning" | "failed" | "no_subscriptions";
type EmailAlertStatus = "not_requested" | "sent" | "failed" | "not_configured";

type PushDeliveryLog = {
  id: string;
  order_number: string | null;
  registered_subscriptions: number;
  delivered_count: number;
  failed_count: number;
  expired_removed_count: number;
  status: DeliveryStatus;
  failure_summary: string | null;
  email_alert_status: EmailAlertStatus;
  email_alert_error: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<DeliveryStatus, string> = {
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-300/25",
  warning: "bg-amber-500/15 text-amber-200 border-amber-200/25",
  failed: "bg-ember/15 text-ember border-ember/30",
  no_subscriptions: "bg-ember/15 text-ember border-ember/30",
};

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  delivered: "Delivered",
  warning: "Partially delivered",
  failed: "Delivery failed",
  no_subscriptions: "No admin device",
};

const EMAIL_LABEL: Record<EmailAlertStatus, string> = {
  not_requested: "Not needed",
  sent: "Email sent",
  failed: "Email failed",
  not_configured: "Email not configured",
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

export default function AdminNotificationHealthPage() {
  const [logs, setLogs] = useState<PushDeliveryLog[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from("push_delivery_logs")
        .select(
          "id, order_number, registered_subscriptions, delivered_count, failed_count, expired_removed_count, status, failure_summary, email_alert_status, email_alert_error, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setErrorMessage("Unable to load notification health. Please refresh and try again.");
        setLogs([]);
        return;
      }

      setLogs((data ?? []) as PushDeliveryLog[]);
    }

    void loadLogs();
  }, []);

  const summary = useMemo(() => {
    const entries = logs ?? [];
    const critical = entries.filter((entry) => entry.status === "failed" || entry.status === "no_subscriptions").length;
    const warnings = entries.filter((entry) => entry.status === "warning").length;
    const latest = entries[0] ?? null;
    return { critical, warnings, latest };
  }, [logs]);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <Link href="/admin" className="font-body text-sm text-bone/60 hover:text-flame">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl text-bone sm:text-3xl">Notification Health</h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-bone/60">
          Recent order-notification attempts. This page shows safe delivery counts only; device endpoints and private keys are never displayed.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-sm border border-ember/30 bg-ember/10 p-4 font-body text-sm text-ember">
          {errorMessage}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-sm border border-bone/10 bg-smoke-light p-4">
          <p className="font-utility text-xs uppercase tracking-wide text-bone/45">Critical alerts</p>
          <p className="mt-2 font-utility text-3xl font-bold text-ember">{logs === null ? "—" : summary.critical}</p>
          <p className="mt-1 font-body text-xs text-bone/50">All devices failed or no device was registered.</p>
        </div>
        <div className="rounded-sm border border-bone/10 bg-smoke-light p-4">
          <p className="font-utility text-xs uppercase tracking-wide text-bone/45">Partial failures</p>
          <p className="mt-2 font-utility text-3xl font-bold text-amber-200">{logs === null ? "—" : summary.warnings}</p>
          <p className="mt-1 font-body text-xs text-bone/50">At least one registered device still received the alert.</p>
        </div>
        <div className="rounded-sm border border-bone/10 bg-smoke-light p-4">
          <p className="font-utility text-xs uppercase tracking-wide text-bone/45">Latest check</p>
          <p className="mt-2 font-body text-sm text-bone">{summary.latest ? formatDateTime(summary.latest.created_at) : logs === null ? "Loading…" : "No orders yet"}</p>
          <p className="mt-1 font-body text-xs text-bone/50">South African time.</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-sm border border-bone/10 bg-smoke-light">
        <div className="border-b border-bone/10 px-4 py-4 sm:px-5">
          <h2 className="font-display text-xl text-bone">Recent delivery attempts</h2>
          <p className="mt-1 font-body text-xs text-bone/50">The newest 50 order notifications are retained here for review.</p>
        </div>

        {logs === null ? (
          <div className="space-y-3 p-4 sm:p-5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-24 animate-pulse rounded-sm bg-smoke" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 sm:p-8">
            <p className="font-body text-sm text-bone/70">No notification attempts have been recorded yet.</p>
            <p className="mt-2 font-body text-sm leading-6 text-bone/50">
              Enable order notifications on at least one signed-in admin device, then place a normal internal test order to create the first health record.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-bone/10">
            {logs.map((entry) => (
              <li key={entry.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 font-utility text-[11px] uppercase tracking-wide ${STATUS_STYLE[entry.status]}`}>
                        {STATUS_LABEL[entry.status]}
                      </span>
                      <span className="font-body text-sm text-bone/70">
                        {entry.order_number ? `Order ${entry.order_number}` : "Order reference unavailable"}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-6 text-bone/60">
                      {entry.failure_summary ?? "All registered devices accepted the notification."}
                    </p>
                  </div>
                  <p className="shrink-0 font-body text-xs text-bone/45">{formatDateTime(entry.created_at)}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                  <div className="rounded-sm bg-smoke p-2.5">
                    <p className="font-utility text-lg text-bone">{entry.registered_subscriptions}</p>
                    <p className="font-body text-[11px] text-bone/45">Registered</p>
                  </div>
                  <div className="rounded-sm bg-smoke p-2.5">
                    <p className="font-utility text-lg text-emerald-300">{entry.delivered_count}</p>
                    <p className="font-body text-[11px] text-bone/45">Delivered</p>
                  </div>
                  <div className="rounded-sm bg-smoke p-2.5">
                    <p className="font-utility text-lg text-ember">{entry.failed_count}</p>
                    <p className="font-body text-[11px] text-bone/45">Failed</p>
                  </div>
                  <div className="rounded-sm bg-smoke p-2.5">
                    <p className="font-utility text-lg text-bone">{entry.expired_removed_count}</p>
                    <p className="font-body text-[11px] text-bone/45">Expired removed</p>
                  </div>
                  <div className="col-span-2 rounded-sm bg-smoke p-2.5 sm:col-span-1">
                    <p className="font-utility text-xs text-bone">{EMAIL_LABEL[entry.email_alert_status]}</p>
                    <p className="font-body text-[11px] text-bone/45">Critical email</p>
                  </div>
                </div>

                {entry.email_alert_error && (
                  <p className="mt-3 font-body text-xs text-ember/85">Email note: {entry.email_alert_error}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
