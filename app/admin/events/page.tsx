"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import ImageUploadButton from "@/app/components/ImageUploadButton";

interface EventRow {
  id: string;
  name: string;
  event_date: string;
  entry_type: string;
  status: string;
  cover_image_url: string | null;
  description: string | null;
}

async function fetchEvents(): Promise<EventRow[]> {
  const { data } = await supabase
    .from("events")
    .select("id, name, event_date, entry_type, status, cover_image_url, description")
    .order("event_date", { ascending: false });

  return (data as EventRow[]) ?? [];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    event_date: "",
    entry_type: "free" as "free" | "paid",
    cover_image_url: "",
    description: "",
  });
  const [editingPosterId, setEditingPosterId] = useState<string | null>(null);
  const [editingPosterUrl, setEditingPosterUrl] = useState("");
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDescriptionText, setEditingDescriptionText] = useState("");

  const load = useCallback(async () => {
    setEvents(await fetchEvents());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchEvents().then((data) => {
      if (!cancelled) setEvents(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.event_date) return;
    await supabase.from("events").insert({
      name: form.name,
      event_date: form.event_date,
      entry_type: form.entry_type,
      cover_image_url: form.cover_image_url.trim() || null,
      description: form.description.trim() || null,
      status: "upcoming",
    });
    setForm({ name: "", event_date: "", entry_type: "free", cover_image_url: "", description: "" });
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

  async function saveUploadedPoster(id: string, url: string) {
    await supabase.from("events").update({ cover_image_url: url }).eq("id", id);
    setEditingPosterId(null);
    load();
  }

  function startEditDescription(ev: EventRow) {
    setEditingDescriptionId(ev.id);
    setEditingDescriptionText(ev.description ?? "");
  }

  async function saveDescription(id: string) {
    await supabase
      .from("events")
      .update({ description: editingDescriptionText.trim() || null })
      .eq("id", id);
    setEditingDescriptionId(null);
    load();
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "upcoming" ? "past" : "upcoming";
    await supabase.from("events").update({ status: newStatus }).eq("id", id);
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
              Poster / cover image
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                placeholder="Paste a URL, or upload from device below"
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                className="flex-1 min-w-[200px] bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone"
              />
              <ImageUploadButton
                folder="events"
                onUploaded={(url) => setForm({ ...form, cover_image_url: url })}
                label="Upload From Device"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-xs text-bone/50 mb-1">
              Additional information (optional — theme, pricing details, what to bring, etc.)
            </label>
            <textarea
              placeholder="e.g. Free entry, cooler box R80, hubbly pass R100. 13:00 till late."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-smoke border border-bone/20 rounded-sm px-3 py-2 text-bone resize-y"
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
                <div className="relative w-16 h-16 rounded-sm shrink-0 border border-bone/10 overflow-hidden">
                  <Image src={ev.cover_image_url} alt="" fill sizes="64px" className="object-cover" />
                </div>
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
                    <ImageUploadButton
                      folder="events"
                      onUploaded={(url) => saveUploadedPoster(ev.id, url)}
                      label="Upload From Device"
                    />
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

                <div className="mt-2">
                  {editingDescriptionId === ev.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingDescriptionText}
                        onChange={(e) => setEditingDescriptionText(e.target.value)}
                        rows={3}
                        className="bg-smoke border border-bone/20 rounded-sm px-2 py-1 text-bone text-sm w-full resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveDescription(ev.id)}
                          className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-flame text-bone"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDescriptionId(null)}
                          className="font-body text-xs text-bone/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      {ev.description && (
                        <p className="font-body text-bone/50 text-xs flex-1">{ev.description}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => startEditDescription(ev)}
                        className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/70 shrink-0"
                      >
                        {ev.description ? "Edit Info" : "+ Add Info"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleStatus(ev.id, ev.status)}
                className="font-body text-xs uppercase px-2 py-1 rounded-sm bg-smoke border border-bone/20 text-bone/60"
              >
                {ev.status === "upcoming" ? "Mark Past" : "Mark Upcoming"}
              </button>
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
