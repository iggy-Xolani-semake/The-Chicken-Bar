"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type Status = "new" | "contacted" | "approved" | "declined" | "paid" | "completed";

interface Booking {
  id: string;
  full_name: string;
  business_name: string | null;
  whatsapp_number: string;
  business_category: string | null;
  status: Status;
  created_at: string;
}

interface StallSetting {
  id: string;
  event_id: string | null;
  stall_type: string;
  price: number;
  total_available: number;
  spots_taken: number;
  booking_deadline: string | null;
  is_active: boolean;
}

interface EventOption {
  id: string;
  name: string;
}

const STATUSES: Status[] = ["new", "contacted", "approved", "declined", "paid", "completed"];

export default function AdminStallsPage() {
  const [tab, setTab] = useState<"applications" | "settings">("applications");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [stallSettings, setStallSettings] = useState<StallSetting[] | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({
    event_id: "",
    stall_type: "",
    price: "",
    total_available: "",
    booking_deadline: "",
  });

  const loadBookings = useCallback(async () => {
    const { data } = await supabase
      .from("stall_bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings((data as Booking[]) ?? []);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("stall_settings")
      .select("*")
      .order("booking_deadline", { ascending: true });
    setStallSettings((data as StallSetting[]) ?? []);

    const { data: eventRows } = await supabase
      .from("events")
      .select("id, name")
      .eq("status", "upcoming")
      .order("event_date");
    setEvents((eventRows as EventOption[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      supabase.from("stall_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("stall_settings").select("*").order("booking_deadline", { ascending: true }),
      supabase.from("events").select("id, name").eq("status", "upcoming").order("event_date"),
    ]).then(([{ data: bookingRows }, { data: settingRows }, { data: eventRows }]) => {
      if (cancelled) return;
      setBookings((bookingRows as Booking[]) ?? []);
      setStallSettings((settingRows as StallSetting[]) ?? []);
      setEvents((eventRows as EventOption[]) ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function setStatus(id: string, status: Status) {
    await supabase.from("stall_bookings").update({ status }).eq("id", id);
    loadBookings();
  }

  async function addStallSetting(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(newSetting.price);
    const total = parseInt(newSetting.total_available, 10);
    if (!newSetting.stall_type.trim() || isNaN(price) || isNaN(total)) return;

    await supabase.from("stall_settings").insert({
      event_id: newSetting.event_id || null,
      stall_type: newSetting.stall_type.trim(),
      price,
      total_available: total,
      booking_deadline: newSetting.booking_deadline || null,
      is_active: true,
    });

    setNewSetting({ event_id: "", stall_type: "", price: "", total_available: "", booking_deadline: "" });
    setShowAddForm(false);
    loadSettings();
  }

  async function toggleSettingActive(setting: StallSetting) {
    await supabase.from("stall_settings").update({ is_active: !setting.is_active }).eq("id", setting.id);
    loadSettings();
  }

  async function deleteSetting(id: string) {
    await supabase.from("stall_settings").delete().eq("id", id);
    loadSettings();
  }

  return (
    <div>
      <h1 className="font-display text-bone text-3xl mb-6">Stalls</h1>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("applications")}
          className={`font-body text-sm px-4 py-2 rounded-sm ${
            tab === "applications" ? "bg-flame text-bone" : "bg-smoke-light text-bone/60"
          }`}
        >
          Applications
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`font-body text-sm px-4 py-2 rounded-sm ${
            tab === "settings" ? "bg-flame text-bone" : "bg-smoke-light text-bone/60"
          }`}
        >
          Stall Settings
        </button>
      </div>

      {tab === "applications" && (
        <>
          {bookings === null && <p className="font-body text-bone/50">Loading...</p>}
          {bookings !== null && bookings.length === 0 && (
            <p className="font-body text-bone/50">No applications yet.</p>
          )}
          <div className="space-y-3">
            {bookings?.map((b) => (
              <div key={b.id} className="bg-smoke-light border border-bone/10 rounded-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-body text-bone">{b.full_name}</p>
                    <p className="font-body text-bone/50 text-sm">
                      {b.business_name ?? "—"} · {b.whatsapp_number}
                    </p>
                  </div>
                  <span className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-bone/10 text-bone/70">
                    {b.status}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(b.id, s)}
                      disabled={b.status === s}
                      className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/60 hover:border-flame disabled:opacity-30"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "settings" && (
        <>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember mb-4"
          >
            {showAddForm ? "Cancel" : "+ Add Stall Type"}
          </button>

          {showAddForm && (
            <form
              onSubmit={addStallSetting}
              className="bg-smoke-light border border-bone/10 rounded-sm p-4 mb-6 space-y-3"
            >
              <select
                value={newSetting.event_id}
                onChange={(e) => setNewSetting({ ...newSetting, event_id: e.target.value })}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              >
                <option value="">No specific event (general)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Stall type (e.g. Food Stall, Clothing Stall)"
                value={newSetting.stall_type}
                onChange={(e) => setNewSetting({ ...newSetting, stall_type: e.target.value })}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              />
              <input
                placeholder="Price"
                type="number"
                value={newSetting.price}
                onChange={(e) => setNewSetting({ ...newSetting, price: e.target.value })}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              />
              <input
                placeholder="Total stalls available"
                type="number"
                value={newSetting.total_available}
                onChange={(e) => setNewSetting({ ...newSetting, total_available: e.target.value })}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              />
              <input
                type="date"
                value={newSetting.booking_deadline}
                onChange={(e) => setNewSetting({ ...newSetting, booking_deadline: e.target.value })}
                className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              />
              <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
                Save
              </button>
            </form>
          )}

          {stallSettings === null && <p className="font-body text-bone/50">Loading...</p>}
          {stallSettings !== null && stallSettings.length === 0 && (
            <p className="font-body text-bone/50">No stall types configured yet.</p>
          )}
          <div className="space-y-2">
            {stallSettings?.map((s) => (
              <div
                key={s.id}
                className={`bg-smoke-light border border-bone/10 rounded-sm p-4 flex items-center justify-between ${
                  !s.is_active ? "opacity-40" : ""
                }`}
              >
                <div>
                  <p className="font-body text-bone">{s.stall_type}</p>
                  <p className="font-utility text-char text-sm">
                    R{s.price} &middot; {s.spots_taken}/{s.total_available} taken
                    {s.booking_deadline && ` · Deadline: ${s.booking_deadline}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSettingActive(s)}
                    className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/70"
                  >
                    {s.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSetting(s.id)}
                    className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-ember/40 text-ember"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
