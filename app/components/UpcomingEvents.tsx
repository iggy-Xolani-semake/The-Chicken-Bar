"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUpcomingEvents } from "@/lib/supabase/queries";
import { getEventCountdown } from "@/lib/eventCountdown";
import type { RestaurantEvent } from "@/lib/supabase/types";

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<RestaurantEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUpcomingEvents()
      .then((data) => !cancelled && setEvents(data))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="upcoming-events" className="texture-wood texture-wood-events texture-wood-overlay px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-utility text-char text-sm tracking-[0.3em] uppercase mb-3">
            What&apos;s coming up
          </p>
          <h2 className="font-display text-bone text-5xl md:text-6xl">Upcoming Events</h2>
        </div>

        {error && (
          <p className="text-center font-body text-bone/60">
            Couldn&apos;t load events right now.
          </p>
        )}

        {!error && events === null && (
          <div className="grid md:grid-cols-3 gap-6" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-smoke-light border border-bone/10 rounded-sm h-56 animate-pulse" />
            ))}
          </div>
        )}

        {!error && events !== null && events.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <WatchThisSpaceCard />
          </div>
        )}

        {!error && events !== null && events.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((event) => {
              const countdown = getEventCountdown(new Date(), event.event_date);
              return (
                <div
                  key={event.id}
                  className="bg-smoke-light border border-bone/10 rounded-sm overflow-hidden hover:border-flame/60 transition-colors"
                >
                  <div className="relative">
                    {event.cover_image_url && (
                      <Image
                        src={event.cover_image_url}
                        alt={event.name}
                        width={800}
                        height={800}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full max-h-96 h-auto object-contain bg-smoke"
                      />
                    )}
                    {countdown.daysUntil >= 0 && (
                      <span
                        className={`absolute font-utility text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-sm ${
                          event.cover_image_url
                            ? "top-2 right-2 bg-flame text-bone shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                            : "top-3 right-3 bg-flame/15 text-flame border border-flame/30"
                        }`}
                      >
                        {countdown.label}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-body font-bold text-bone text-lg mb-1">{event.name}</h3>
                    <p className="font-utility text-char text-sm mb-2">
                      {formatEventDate(event.event_date)}
                    </p>
                    <p className="font-body text-sm mb-4">
                      {event.entry_type === "free" ? (
                        <span className="text-flame font-semibold">Free Entry</span>
                      ) : (
                        <span className="text-ember font-semibold">
                          Tickets from R{event.ticket_price_from}
                        </span>
                      )}
                    </p>
                    <Link
                      href={`/events/${event.id}`}
                      className="font-body font-semibold text-sm uppercase tracking-wide text-bone/70 hover:text-char underline underline-offset-4"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// A permanent, non-dated placeholder tile — deliberately NOT a real
// events table row, since "keep watching this space" has no date and
// isn't a real event. Only rendered in the true empty-state (see the
// events.length === 0 branch above) — once real events exist on the
// roster, this placeholder steps aside rather than sitting alongside
// them.
// Not admin-editable via /admin/events (it's UI, not data) — if the
// owner wants this copy editable without a code change later, it
// would need a small settings-table column, not an events row.
function WatchThisSpaceCard() {
  return (
    <div className="bg-smoke-light border border-dashed border-bone/20 rounded-sm overflow-hidden flex flex-col items-center justify-center text-center p-6 h-56">
      <p className="font-display text-flame text-2xl mb-2">Watch this space</p>
      <p className="font-body text-bone/60 text-sm">
        More events on the way — follow us on Facebook so you don&apos;t miss the next one.
      </p>
    </div>
  );
}
