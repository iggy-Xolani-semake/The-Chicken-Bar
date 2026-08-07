"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Settings {
  id: string;
  name: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  whatsapp_orders_number: string;
  whatsapp_events_number: string;
  whatsapp_stalls_number: string;
  order_hours_mon_thu_open: string;
  order_hours_mon_thu_close: string;
  order_hours_fri_sun_open: string;
  order_hours_fri_sun_close: string;
  facebook_url: string | null;
  car_wash_enabled: boolean;
  delivery_fee: number | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("restaurant_settings")
      .select("*")
      .single()
      .then(({ data }) => setSettings(data as Settings));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    await supabase
      .from("restaurant_settings")
      .update({
        name: settings.name,
        phone_primary: settings.phone_primary,
        phone_secondary: settings.phone_secondary,
        email: settings.email,
        whatsapp_orders_number: settings.whatsapp_orders_number,
        whatsapp_events_number: settings.whatsapp_events_number,
        whatsapp_stalls_number: settings.whatsapp_stalls_number,
        order_hours_mon_thu_open: settings.order_hours_mon_thu_open,
        order_hours_mon_thu_close: settings.order_hours_mon_thu_close,
        order_hours_fri_sun_open: settings.order_hours_fri_sun_open,
        order_hours_fri_sun_close: settings.order_hours_fri_sun_close,
        facebook_url: settings.facebook_url,
        car_wash_enabled: settings.car_wash_enabled,
        delivery_fee: settings.delivery_fee,
      })
      .eq("id", settings.id);
    setSaving(false);
    setSaved(true);
  }

  if (!settings) return <p className="font-body text-bone/50">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-bone text-3xl mb-8">Restaurant Settings</h1>

      <div className="space-y-6">
        <section>
          <h2 className="font-body font-bold text-bone mb-3">Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone 1" value={settings.phone_primary} onChange={(v) => update("phone_primary", v)} />
            <Field label="Phone 2" value={settings.phone_secondary} onChange={(v) => update("phone_secondary", v)} />
            <Field label="Email" value={settings.email} onChange={(v) => update("email", v)} full />
          </div>
        </section>

        <section>
          <h2 className="font-body font-bold text-bone mb-3">WhatsApp Routing</h2>
          <div className="space-y-3">
            <Field
              label="Food Orders"
              value={settings.whatsapp_orders_number}
              onChange={(v) => update("whatsapp_orders_number", v)}
              full
            />
            <Field
              label="Event Enquiries"
              value={settings.whatsapp_events_number}
              onChange={(v) => update("whatsapp_events_number", v)}
              full
            />
            <Field
              label="Stall Bookings"
              value={settings.whatsapp_stalls_number}
              onChange={(v) => update("whatsapp_stalls_number", v)}
              full
            />
          </div>
        </section>

        <section>
          <h2 className="font-body font-bold text-bone mb-3">Order Hours</h2>
          <p className="font-body text-bone/50 text-sm mb-3">Monday - Thursday</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field
              label="Open"
              value={settings.order_hours_mon_thu_open}
              onChange={(v) => update("order_hours_mon_thu_open", v)}
              type="time"
            />
            <Field
              label="Close"
              value={settings.order_hours_mon_thu_close}
              onChange={(v) => update("order_hours_mon_thu_close", v)}
              type="time"
            />
          </div>
          <p className="font-body text-bone/50 text-sm mb-3">Friday - Sunday</p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Open"
              value={settings.order_hours_fri_sun_open}
              onChange={(v) => update("order_hours_fri_sun_open", v)}
              type="time"
            />
            <Field
              label="Close"
              value={settings.order_hours_fri_sun_close}
              onChange={(v) => update("order_hours_fri_sun_close", v)}
              type="time"
            />
          </div>
        </section>

        <section>
          <h2 className="font-body font-bold text-bone mb-3">Delivery</h2>
          <label className="block font-body text-xs text-bone/50 mb-1">
            Delivery fee (leave blank to keep &quot;confirm on WhatsApp&quot;)
          </label>
          <input
            type="number"
            value={settings.delivery_fee ?? ""}
            onChange={(e) =>
              update("delivery_fee", e.target.value === "" ? null : parseFloat(e.target.value))
            }
            placeholder="e.g. 30"
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone text-sm max-w-xs"
          />
        </section>

        <section>
          <h2 className="font-body font-bold text-bone mb-3">Services</h2>
          <label className="flex items-center gap-2 font-body text-bone/70">
            <input
              type="checkbox"
              checked={settings.car_wash_enabled}
              onChange={(e) => update("car_wash_enabled", e.target.checked)}
            />
            Car wash service enabled
          </label>
        </section>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="font-body font-bold uppercase tracking-wide bg-flame text-bone px-6 py-3 rounded-sm hover:bg-ember disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  full,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  type?: string;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block font-body text-xs text-bone/50 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone text-sm"
      />
    </div>
  );
}
