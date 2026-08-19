"use client";

import { useEffect, useState } from "react";
import { getFeaturedItems } from "@/lib/supabase/queries";
import type { MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "./MenuItemCard";

export default function FeaturedFood() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFeaturedItems(3)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="menu" className="bg-smoke px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-utility text-char text-sm tracking-[0.3em] uppercase mb-3">
            Off the flame
          </p>
          <h2 className="font-display text-bone text-5xl md:text-6xl">
            Today&apos;s Menu
          </h2>
        </div>

        {error && (
          <p className="text-center font-body text-bone/60">
            Couldn&apos;t load the menu right now — please try refreshing, or
            head straight to the full menu below.
          </p>
        )}

        {!error && items === null && (
          <div className="grid md:grid-cols-3 gap-6" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-smoke-light border border-bone/10 rounded-sm p-6 h-48 animate-pulse"
              />
            ))}
          </div>
        )}

        {!error && items !== null && items.length === 0 && (
          <p className="text-center font-body text-bone/60">
            Nothing featured just yet — check out the full menu below.
          </p>
        )}

        {!error && items !== null && items.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <a
            href="/menu"
            className="font-body font-semibold text-bone/70 hover:text-char underline underline-offset-4 transition-colors"
          >
            See the full menu &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
