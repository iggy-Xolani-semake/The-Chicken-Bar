"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface EventRow {
  id: string;
  name: string;
  event_date: string;
  entry_type: string;
  status: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", event_date: "", entry_type: "free" as "free" | "paid" });

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, name, event_date, entry_type, status")
      .order("event_date", { ascending: false });
    setEvents((data as EventRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.event_date) return;
    await supabase.from("events").insert({ ...form, status: "upcoming" });
    setForm({ name: "", event_date: "", entry_type: "free" });
    setShowForm(false);
    load();
  }

  async function markPast(id: string) {
    await supabase.from("events").update({ status: "past" }).eq("id", id);
    load();
  }

  async function deleteEvent(id: string) {
    await supabase.from("events").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-bone text-3xl">Events</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm hover:bg-ember"
        >
          + Create Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={createEvent} className="bg-smoke-light border border-bone/10 rounded-sm p-4 mb-6 space-y-3">
          <input
            placeholder="Event name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          />
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          />
          <select
            value={form.entry_type}
            onChange={(e) => setForm({ ...form, entry_type: e.target.value as "free" | "paid" })}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
          >
            <option value="free">Free Entry</option>
            <option value="paid">Paid Entry</option>
          </select>
          <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
            Save Event
          </button>
        </form>
      )}

      <div className="space-y-2">
        {events?.map((ev) => (
          <div
            key={ev.id}
            className="bg-smoke-light border border-bone/10 rounded-sm p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-body text-bone">{ev.name}</p>
              <p className="font-body text-bone/50 text-sm">
                {ev.event_date} · {ev.entry_type} · {ev.status}
              </p>
            </div>
            <div className="flex gap-2">
              {ev.status === "upcoming" && (
                <button
                  type="button"
                  onClick={() => markPast(ev.id)}
                  className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/60"
                >
                  Mark Past
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteEvent(ev.id)}
                className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-ember/40 text-ember"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
