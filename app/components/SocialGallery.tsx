"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface GalleryImage {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
}

const FALLBACK_IMAGES: GalleryImage[] = [
  {
    id: "fallback-chicken",
    image_url: "/gallery/chicken-quarters.jpg",
    category: "food",
    caption: "Flame-grilled chicken, straight from the fire",
  },
  {
    id: "fallback-takeaway",
    image_url: "/gallery/takeaway-box.jpg",
    category: "food",
    caption: "Packed and ready when the craving hits",
  },
  {
    id: "fallback-burger",
    image_url: "/gallery/burger-plate.jpg",
    category: "food",
    caption: "Big flavour, proper portions",
  },
];

export default function SocialGallery() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("gallery_images")
      .select("id, image_url, category, caption")
      .order("display_order", { ascending: true })
      .limit(12)
      .then(({ data }) => {
        if (!cancelled) setImages((data as GalleryImage[]) ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayImages = images && images.length > 0 ? images : FALLBACK_IMAGES;
  const usingFallback = images !== null && images.length === 0;

  return (
    <section id="gallery" className="texture-wood texture-wood-gallery texture-wood-overlay scroll-mt-24 px-5 py-16 sm:px-6 sm:scroll-mt-28 md:px-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-4 md:mb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-utility text-xs font-bold uppercase tracking-[0.28em] text-char">
              The Chicken Bar experience
            </p>
            <h2 className="mt-3 font-display text-4xl leading-none text-bone sm:text-5xl md:text-6xl">
              Food worth leaving the house for.
            </h2>
            <p className="mt-4 max-w-2xl font-body text-lg text-bone/75">
              Flame, flavour and proper portions — made for a quick plate, a big order, or a full vibe with the crew.
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex min-h-11 items-center justify-center border border-char px-4 py-2 font-body text-sm font-bold uppercase tracking-wide text-char transition-colors hover:bg-char hover:text-ink"
          >
            Order your plate
          </Link>
        </div>

        {images === null ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="aspect-square animate-pulse bg-smoke-light" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-4 md:gap-4">
              {displayImages.slice(0, 8).map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setLightboxIdx(index)}
                  className={`group relative overflow-hidden border border-bone/15 text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-char ${
                    index === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <Image
                    src={image.image_url}
                    alt={image.caption ?? "The Chicken Bar food and vibes"}
                    fill
                    sizes={index === 0 ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 50vw, 25vw"}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  {(index === 0 || image.caption) && (
                    <p className="absolute inset-x-0 bottom-0 p-3 font-body text-sm text-bone md:p-4">
                      {image.caption ?? "The Chicken Bar"}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {usingFallback && (
              <p className="mt-4 font-body text-sm text-bone/55">
                Fresh moments from The Chicken Bar — add more high-quality photos from Admin Gallery to keep this feed growing.
              </p>
            )}
          </>
        )}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-5 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
          onClick={() => setLightboxIdx(null)}
        >
          <Image
            src={displayImages[lightboxIdx].image_url}
            alt={displayImages[lightboxIdx].caption ?? "The Chicken Bar food and vibes"}
            width={1400}
            height={1400}
            sizes="100vw"
            className="max-h-full max-w-full rounded-sm object-contain"
          />
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close gallery image"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center border border-bone/40 text-2xl text-bone sm:right-8 sm:top-8"
          >
            &times;
          </button>
        </div>
      )}
    </section>
  );
}
