"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getMenuItems } from "@/lib/supabase/queries";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "@/app/components/MenuItemCard";

export default function FullMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMenuItems("main")
      .then(({ categories, itemsByCategory }) => {
        setCategories(categories);
        setItemsByCategory(itemsByCategory);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="texture-wood texture-wood-gallery">
      {/* Header band with texture-wood-overlay for legibility, matching the
          treatment already used on Hero/Events/Majita sections */}
      <div className="texture-wood-overlay px-6 md:px-12 py-16">
        <h1 className="font-display text-bone text-5xl text-center">Full Menu</h1>
      </div>

      <div className="texture-wood-overlay px-6 md:px-12 pb-16 max-w-6xl mx-auto">
        {error && <p className="text-center font-body text-bone/60">Couldn&apos;t load the menu.</p>}

        {!error && categories === null && (
          <p className="text-center font-body text-bone/50">Loading menu...</p>
        )}

        {!error &&
          categories?.map((cat) => {
            const items = itemsByCategory[cat.id] ?? [];
            if (items.length === 0) return null;

            // Real food photography inserted alongside select sections —
            // only where a confirmed on-brand, usable photo exists. Not
            // every category has one yet; the ones that don't just render
            // the plain grid, same as before, rather than showing a
            // placeholder. Slug matching keeps this tied to real category
            // data instead of guessing by array position.
            const sectionPhoto = SECTION_PHOTOS[cat.slug];

            return (
              <section key={cat.id} className="mb-14">
                <div className={`flex flex-col ${sectionPhoto ? "md:flex-row md:gap-8" : ""} items-start`}>
                  <div className={sectionPhoto ? "md:w-2/3" : "w-full"}>
                    {SECTION_LOGOS[cat.slug] && (
                      <Image
                        src={SECTION_LOGOS[cat.slug].src}
                        alt={SECTION_LOGOS[cat.slug].alt}
                        width={743}
                        height={1024}
                        className="h-24 w-auto mb-4"
                      />
                    )}
                    <h2 className="font-display text-flame text-3xl mb-6">{cat.name}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <MenuItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>

                  {sectionPhoto && (
                    <div className="hidden md:block md:w-1/3 shrink-0 pt-14">
                      <Image
                        src={sectionPhoto.src}
                        alt={sectionPhoto.alt}
                        width={720}
                        height={384}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="w-full h-64 object-cover rounded-sm shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
      </div>
    </main>
  );
}

// Real, confirmed-usable photos only — slug must match an actual
// menu_categories.slug value in the database. If a slug here doesn't
// exist in real data, that photo simply never renders (safe no-op),
// it will not throw.
const SECTION_PHOTOS: Record<string, { src: string; alt: string }> = {
  meals: { src: "/food/meat-platter.jpg", alt: "Grilled chicken, wors, and ribs platter with pap and salads" },
  combos: { src: "/food/meat-platter.jpg", alt: "The Chicken Bar meat combo platter" },
  burgers: { src: "/food/burger.jpg", alt: "The Chicken Bar loaded burger with chips" },
  wraps: { src: "/food/wrap.jpg", alt: "Chicken wrap with seasoned chips" },
  kota: { src: "/food/kota.jpg", alt: "Loaded Chicken Bar kota with russian, vienna, egg, and cheese" },
};

// Same slug-keyed pattern as SECTION_PHOTOS above. Unlike SECTION_PHOTOS
// this doesn't fail invisibly if the file is missing — Next.js's Image
// component will show a broken-image icon in the browser rather than
// crashing the page or failing the build, so it's safe to reference
// ahead of the actual file landing in /public/logo/, but the broken
// icon will be visible until the real file is uploaded.
const SECTION_LOGOS: Record<string, { src: string; alt: string }> = {
  kota: { src: "/logo/kota-bar-wordmark-white.png", alt: "The Kota Bar" },
};
