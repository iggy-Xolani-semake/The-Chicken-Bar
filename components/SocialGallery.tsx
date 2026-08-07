"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ImageScatter, type ScatterSet } from "./ImageScatter";

interface GalleryImage {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
}

const CATEGORY_HEADINGS: Record<string, string> = {
  food: "The Flame",
  vibes: "The Vibes",
  events: "The Moments",
  majita_monday: "Majita Monday",
  customers: "Our People",
  restaurant: "The Spot",
};

// Below this many real photos, the scatter effect looks sparse/broken
// rather than impressive — falls back to a simple grid until there's
// enough volume (e.g. once the 100-thumbnail seed lands).
const SCATTER_MIN_IMAGES = 10;

export default function SocialGallery() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("gallery_images")
      .select("id, image_url, category, caption")
      .order("display_order", { ascending: true })
      .limit(120)
      .then(({ data }) => {
        if (!cancelled) setImages((data as GalleryImage[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const useScatter = images !== null && images.length >= SCATTER_MIN_IMAGES;

  const scatterData: ScatterSet[] = useScatter
    ? Object.entries(
        images!.reduce((acc, img) => {
          (acc[img.category] ??= []).push(img.image_url);
          return acc;
        }, {} as Record<string, string[]>)
      ).map(([category, imgs]) => ({
        heading: CATEGORY_HEADINGS[category] ?? category,
        images: imgs,
      }))
    : [];

  return (
    <section id="gallery" className="texture-wood texture-wood-gallery texture-wood-overlay px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        {!useScatter && (
          <div className="mb-12 text-center">
            <p className="font-utility text-char text-sm tracking-[0.3em] uppercase mb-3">
              The feed
            </p>
            <h2 className="font-display text-bone text-5xl md:text-6xl">Social Gallery</h2>
          </div>
        )}

        {images === null && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-smoke-light rounded-sm h-48 animate-pulse" />
            ))}
          </div>
        )}

        {images !== null && images.length === 0 && (
          <p className="text-center font-body text-bone/60">Photos coming soon.</p>
        )}

        {useScatter && (
          <ImageScatter data={scatterData} className="h-[70vh] min-h-[500px]" />
        )}

        {images !== null && images.length > 0 && !useScatter && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIdx(i)}
                className="relative aspect-square overflow-hidden rounded-sm group focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.caption ?? "The Chicken Bar"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}

        {lightboxIdx !== null && images && !useScatter && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxIdx(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIdx].image_url}
              alt={images[lightboxIdx].caption ?? "The Chicken Bar"}
              className="max-w-full max-h-full object-contain rounded-sm"
            />
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Close"
              className="absolute top-6 right-6 text-bone text-3xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
