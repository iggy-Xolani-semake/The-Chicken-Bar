"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

interface EventRow {
  id: string;
  name: string;
  event_date: string;
  entry_type: string;
  status: string;
  cover_image_url: string | null;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    event_date: "",
    entry_type: "free" as "free" | "paid",
    cover_image_url: "",
  });
  const [editingPosterId, setEditingPosterId] = useState<string | null>(null);
  const [editingPosterUrl, setEditingPosterUrl] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, name, event_date, entry_type, status, cover_image_url")
      .order("event_date", { ascending: false });
    setEvents((data as EventRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.event_date) return;
    await supabase.from("events").insert({
      name: form.name,
      event_date: form.event_date,
      entry_type: form.entry_type,
      cover_image_url: form.cover_image_url.trim() || null,
      status: "upcoming",
    });
    setForm({ name: "", event_date: "", entry_type: "free", cover_image_url: "" });
    setShowForm(false);
    load();
  }

  function startEditPoster(ev: EventRow) {
    setEditingPosterId(ev.id);
    setEditingPosterUrl(ev.cover_image_url ?? "");
  }

  async function savePoster(id: string) {
    await supabase
      .from("events")
      .update({ cover_image_url: editingPosterUrl.trim() || null })
      .eq("id", id);
    setEditingPosterId(null);
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
          <div>
            <label className="block font-body text-xs text-bone/50 mb-1">
              Poster / cover image URL (optional — paste the Supabase storage link once uploaded)
            </label>
            <input
              placeholder="https://..."
              value={form.cover_image_url}
              onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
              className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
            />
          </div>
          <button type="submit" className="font-body text-sm bg-flame text-bone px-4 py-2 rounded-sm">
            Save Event
          </button>
        </form>
      )}

      <div className="space-y-2">
        {events?.map((ev) => (
          <div
            key={ev.id}
            className="bg-smoke-light border border-bone/10 rounded-sm p-4 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {ev.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.cover_image_url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-sm shrink-0 border border-bone/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-sm shrink-0 border border-dashed border-bone/20 flex items-center justify-center">
                  <span className="font-body text-bone/30 text-[10px] text-center uppercase">
                    No poster
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-body text-bone">{ev.name}</p>
                <p className="font-body text-bone/50 text-sm mb-2">
                  {ev.event_date} · {ev.entry_type} · {ev.status}
                </p>

                {editingPosterId === ev.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      placeholder="https://..."
                      value={editingPosterUrl}
                      onChange={(e) => setEditingPosterUrl(e.target.value)}
                      className="bg-smoke border border-bone/20 rounded-sm px-2 py-1 text-bone text-sm flex-1 min-w-[180px]"
                    />
                    <button
                      type="button"
                      onClick={() => savePoster(ev.id)}
                      className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-flame text-bone"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPosterId(null)}
                      className="font-body text-xs text-bone/50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditPoster(ev)}
                    className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/70"
                  >
                    {ev.cover_image_url ? "Change Poster" : "+ Add Poster"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
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
