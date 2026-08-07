"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getEventById } from "@/lib/supabase/queries";
import type { RestaurantEvent } from "@/lib/supabase/types";

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const ROLE_LABELS: Record<string, string> = {
  dj: "DJ",
  artist: "Artist",
  mc: "MC",
  host: "Host",
  performer: "Performer",
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<RestaurantEvent | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEventById(id)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="font-body text-bone/60">Couldn&apos;t load this event.</p>
      </main>
    );
  }

  if (event === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-body text-bone/50">Loading...</p>
      </main>
    );
  }

  if (event === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="font-body text-bone/60">This event doesn&apos;t exist or has been removed.</p>
        <Link href="/#upcoming-events" className="font-body text-flame underline">
          Back to events
        </Link>
      </main>
    );
  }

  const whatsappNumber = event.whatsapp_number_override ?? "27790951258";
  const enquiryText = encodeURIComponent(
    `Hi, I'd like to know more about ${event.name} (${formatEventDate(event.event_date)}).`
  );

  return (
    <main className="px-6 md:px-12 py-12 max-w-3xl mx-auto">
      {event.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_image_url}
          alt={event.name}
          className="w-full aspect-video object-cover rounded-sm mb-8 border border-bone/10"
        />
      )}

      <h1 className="font-display text-flame text-4xl md:text-5xl mb-3">{event.name}</h1>
      <p className="font-utility text-char text-lg mb-1">{formatEventDate(event.event_date)}</p>
      {(event.start_time || event.end_time) && (
        <p className="font-body text-bone/60 text-sm mb-4">
          {event.start_time}
          {event.end_time && ` – ${event.end_time}`}
        </p>
      )}

      <p className="font-body text-lg mb-6">
        {event.entry_type === "free" ? (
          <span className="text-flame font-semibold">Free Entry</span>
        ) : (
          <span className="text-ember font-semibold">
            Tickets from R{event.ticket_price_from}
            {event.ticket_info && <span className="block text-sm text-bone/60 font-normal mt-1">{event.ticket_info}</span>}
          </span>
        )}
      </p>

      {event.description && (
        <p className="font-body text-bone/80 mb-8 whitespace-pre-line">{event.description}</p>
      )}

      {event.location && (
        <p className="font-body text-bone/60 text-sm mb-8">📍 {event.location}</p>
      )}

      {/* Entertainment — only rendered if any exists, per brief:
          "do not force entertainment information onto events that
          don't have it" */}
      {event.event_entertainment.length > 0 && (
        <section className="mb-10">
          <h2 className="font-body font-bold text-bone text-xl mb-4">Lineup</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {event.event_entertainment
              .sort((a, b) => a.display_order - b.display_order)
              .map((ent) => (
                <div key={ent.id} className="bg-smoke-light border border-bone/10 rounded-sm p-4 flex gap-3">
                  {ent.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ent.photo_url}
                      alt={ent.name}
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-body font-semibold text-bone">{ent.name}</p>
                    <p className="font-utility text-char text-xs uppercase">
                      {ROLE_LABELS[ent.role] ?? ent.role}
                    </p>
                    {ent.set_time && <p className="font-body text-bone/50 text-xs mt-1">{ent.set_time}</p>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Photos — only if this event has its own images (distinct from
          the general gallery) */}
      {event.event_images.length > 0 && (
        <section className="mb-10">
          <h2 className="font-body font-bold text-bone text-xl mb-4">Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {event.event_images
              .sort((a, b) => a.display_order - b.display_order)
              .map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.caption ?? event.name}
                  className="w-full aspect-square object-cover rounded-sm"
                />
              ))}
          </div>
        </section>
      )}

      <a
        href={`https://wa.me/${whatsappNumber}?text=${enquiryText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block font-body font-bold uppercase tracking-wide bg-flame text-bone px-8 py-4 rounded-sm hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
      >
        {event.entry_type === "paid" ? "Get Tickets / Enquire" : "Enquire on WhatsApp"}
      </a>
    </main>
  );
}
