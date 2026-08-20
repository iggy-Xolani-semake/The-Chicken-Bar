"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getMenuAvailabilitySettings,
  getMenuItems,
  type MenuAvailabilitySettings,
} from "@/lib/supabase/queries";
import { getMainCategoryAvailability } from "@/lib/menuAvailability";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "@/app/components/MenuItemCard";

export default function FullMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [availabilitySettings, setAvailabilitySettings] = useState<MenuAvailabilitySettings | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getMenuItems("main"), getMenuAvailabilitySettings()])
      .then(([menu, settings]) => {
        if (cancelled) return;
        setCategories(menu.categories);
        setItemsByCategory(menu.itemsByCategory);
        setAvailabilitySettings(settings);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="texture-wood texture-wood-gallery">
      <div className="texture-wood-overlay px-6 py-16 md:px-12">
        <h1 className="font-display text-center text-5xl text-bone">Full Menu</h1>
        <p className="mx-auto mt-3 max-w-xl text-center font-body text-bone/70">
          Choose your plate, then add your extras exactly how you like them.
        </p>
      </div>

      <div className="texture-wood-overlay mx-auto max-w-6xl px-6 pb-16 md:px-12">
        {error && <p className="text-center font-body text-bone/60">Couldn&apos;t load the menu.</p>}

        {!error && categories === null && <p className="text-center font-body text-bone/50">Loading menu...</p>}

        {!error &&
          categories?.map((cat) => {
            const categoryItems = itemsByCategory[cat.id] ?? [];
            if (categoryItems.length === 0) return null;

            const availability = availabilitySettings
              ? getMainCategoryAvailability(now, cat.slug, availabilitySettings)
              : { isOrderable: false, message: "Checking ordering availability..." };
            const sectionPhoto = SECTION_PHOTOS[cat.slug];

            return (
              <section key={cat.id} className="mb-14" aria-labelledby={`category-${cat.slug}`}>
                <div className={`flex flex-col items-start ${sectionPhoto ? "md:flex-row md:gap-8" : ""}`}>
                  <div className={sectionPhoto ? "md:w-2/3" : "w-full"}>
                    {SECTION_LOGOS[cat.slug] && (
                      <Image
                        src={SECTION_LOGOS[cat.slug].src}
                        alt={SECTION_LOGOS[cat.slug].alt}
                        width={743}
                        height={1024}
                        className="mb-4 h-24 w-auto"
                      />
                    )}
                    <h2 id={`category-${cat.slug}`} className="mb-3 font-display text-3xl text-flame">
                      {cat.name}
                    </h2>

                    {cat.slug === "kota" && availabilitySettings && (
                      <KotaBarInfo settings={availabilitySettings} />
                    )}

                    {!availability.isOrderable && availability.message && (
                      <p className="mb-5 border border-char/30 bg-char/10 px-4 py-3 font-body text-sm text-bone/80" role="status">
                        {availability.message}
                      </p>
                    )}

                    {cat.slug === "kota" ? (
                      <KotaMenuGroups
                        items={categoryItems}
                        isOrderable={availability.isOrderable}
                        unavailableLabel={availability.message ?? "Kota orders are currently closed"}
                      />
                    ) : (
                      <ItemGrid
                        items={categoryItems}
                        isOrderable={availability.isOrderable}
                        unavailableLabel={availability.message ?? "Orders are currently closed"}
                      />
                    )}
                  </div>

                  {sectionPhoto && (
                    <div className="hidden shrink-0 pt-14 md:block md:w-1/3">
                      <Image
                        src={sectionPhoto.src}
                        alt={sectionPhoto.alt}
                        width={720}
                        height={384}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="h-64 w-full rounded-sm object-cover shadow-lg"
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

function ItemGrid({
  items,
  isOrderable,
  unavailableLabel,
}: {
  items: MenuItem[];
  isOrderable: boolean;
  unavailableLabel: string;
}) {
  const priceOrderedItems = [...items].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {priceOrderedItems.map((item) => (
        <MenuItemCard
          key={item.id}
          item={isOrderable ? item : { ...item, is_available: false }}
          unavailableLabel={unavailableLabel}
        />
      ))}
    </div>
  );
}

function KotaMenuGroups({
  items,
  isOrderable,
  unavailableLabel,
}: {
  items: MenuItem[];
  isOrderable: boolean;
  unavailableLabel: string;
}) {
  const groups = [
    { title: "Kotas", matches: (item: MenuItem) => item.name.startsWith("Kota") },
    { title: "Food Spots", matches: (item: MenuItem) => item.name.startsWith("Food Spot") },
    { title: "Packet Chips", matches: (item: MenuItem) => item.name.startsWith("Packet Chips") },
    { title: "Fat Cakes", matches: (item: MenuItem) => item.name.startsWith("Fat Cake") },
  ];

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const groupedItems = items.filter(group.matches);
        if (groupedItems.length === 0) return null;

        return (
          <div key={group.title}>
            <h3 className="mb-3 font-utility text-xs font-bold uppercase tracking-[0.24em] text-char">
              {group.title}
            </h3>
            <ItemGrid items={groupedItems} isOrderable={isOrderable} unavailableLabel={unavailableLabel} />
          </div>
        );
      })}
    </div>
  );
}

function KotaBarInfo({ settings }: { settings: MenuAvailabilitySettings }) {
  return (
    <aside className="mb-5 border border-flame/40 bg-ink/50 p-4">
      <p className="font-utility text-xs font-bold uppercase tracking-[0.2em] text-char">Separate Kota Bar location</p>
      <p className="mt-2 font-body font-bold text-bone">{settings.kotaBarAddress}</p>
      <p className="mt-1 font-body text-sm text-bone/70">
        Open {settings.kotaBarOpen.slice(0, 5)}–{settings.kotaBarClose.slice(0, 5)}. Online Kota orders are available until {settings.kotaOrderClose.slice(0, 5)}.
      </p>
    </aside>
  );
}

const SECTION_PHOTOS: Record<string, { src: string; alt: string }> = {
  meals: { src: "/food/meat-platter.jpg", alt: "Grilled chicken, wors, and ribs platter with pap and salads" },
  combos: { src: "/food/meat-platter.jpg", alt: "The Chicken Bar meat combo platter" },
  burgers: { src: "/food/burger.jpg", alt: "The Chicken Bar loaded burger with chips" },
  wraps: { src: "/food/wrap.jpg", alt: "Chicken wrap with seasoned chips" },
  kota: { src: "/food/kota.jpg", alt: "Loaded Chicken Bar kota with russian, vienna, egg, and cheese" },
};

const SECTION_LOGOS: Record<string, { src: string; alt: string }> = {
  kota: { src: "/logo/kota-bar-wordmark-white.png", alt: "The Kota Bar" },
};
