"use client";

import { useEffect, useState } from "react";
import { getFeaturedItems } from "@/lib/supabase/queries";
import type { MenuItem } from "@/lib/supabase/types";

/**
 * Hero feature image. Was a 4-item auto-cycling strip; the owner
 * decided only ONE item should be featured at a time (first Full
 * Chicken, then changed to FOFO's Special — see supabase-fixes.sql),
 * so this now just shows whatever single row has is_featured = true
 * — no cycling, no dots, since those only made sense with multiple
 * items. Which item that actually is lives entirely in the database
 * (is_featured flag), not hardcoded here by name, so this keeps
 * working correctly whenever the featured item changes again,
 * without needing a code edit — exactly what happened here.
 */
export default function HeroFeatureStrip() {
  const [item, setItem] = useState<MenuItem | null | undefined>(undefined);

  useEffect(() => {
    getFeaturedItems(1)
      .then((items) => setItem(items[0] ?? null))
      .catch(() => setItem(null));
  }, []);

  if (item === undefined) {
    return <div className="w-full aspect-[4/3] bg-smoke-light rounded-sm animate-pulse" />;
  }

  if (item === null) return null;

  return (
    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border-2 border-flame/40">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-smoke-light flex items-center justify-center">
          <span className="font-display text-flame/30 text-4xl">CB</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="font-body font-bold text-bone text-lg">{item.name}</p>
        <p className="font-utility text-flame text-xl font-bold">R{item.price}</p>
      </div>
    </div>
  );
}
