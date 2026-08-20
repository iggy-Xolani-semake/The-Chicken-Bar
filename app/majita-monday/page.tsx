"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMenuItems, getTodaysSpecialOverride } from "@/lib/supabase/queries";
import { resolveTodaysSpecial } from "@/lib/todaysSpecial";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "@/app/components/MenuItemCard";

export default function MajitaMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isAvailableToday, setIsAvailableToday] = useState<boolean | null>(null);

  useEffect(() => {
    getMenuItems("majita_monday")
      .then(({ categories, itemsByCategory }) => {
        setCategories(categories);
        setItemsByCategory(itemsByCategory);
      })
      .catch((err: Error) => setError(err.message));

    getTodaysSpecialOverride()
      .then((override) => {
        setIsAvailableToday(resolveTodaysSpecial(new Date(), override) === "majita_monday");
      })
      .catch(() => setIsAvailableToday(true));
  }, []);

  return (
    <main className="min-h-screen texture-wood texture-wood-majita">
      <section className="texture-wood-overlay relative overflow-hidden border-b-4 border-flame px-6 py-14 md:px-12 md:py-20">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(circle at 50% 40%, rgba(232,121,31,0.25) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center md:text-left">
            <Image
              src="/logo/majita-wordmark-white.png"
              alt="Majita Monday — Ox Liver, Pork Trotter, Mogodu"
              width={1511}
              height={512}
              priority
              className="mx-auto mb-6 h-auto w-full max-w-md md:mx-0"
            />
            <p className="font-utility text-xs font-bold uppercase tracking-[0.22em] text-char">
              Every Monday · Kasi favourites · Shared properly
            </p>
            <p className="mt-4 font-body text-lg text-bone/80">
              Mogodu, pork and trotters made for a proper plate, a good conversation and a slow start to the week.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-bone/15 bg-ink/80 shadow-xl">
            <Image
              src="/food/majita-mogodu-pork-trotters.jpg"
              alt="Majita Monday mogodu, pork and trotters platter"
              fill
              sizes="(max-width: 767px) 100vw, 42vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <div className="texture-wood-overlay relative px-6 py-12 md:px-12 md:py-16">
        <div className="relative z-10 mx-auto max-w-6xl">
          <MajitaAvailabilityNotice isAvailableToday={isAvailableToday} />

          {error && <p className="text-center font-body text-bone/60">Couldn&apos;t load the menu.</p>}

          {!error && categories === null && <p className="text-center font-body text-bone/50">Loading menu...</p>}

          {!error &&
            categories?.map((cat) => {
              const items = itemsByCategory[cat.id] ?? [];
              if (items.length === 0) return null;
              const categoryPhoto = items.find((item) => item.image_url)?.image_url;

              return (
                <section key={cat.id} className="mb-14" aria-labelledby={`majita-category-${cat.id}`}>
                  <div className={`flex flex-col items-start ${categoryPhoto ? "md:flex-row md:gap-8" : ""}`}>
                    <div className={categoryPhoto ? "md:w-2/3" : "w-full"}>
                      <h2 id={`majita-category-${cat.id}`} className="mb-6 font-display text-3xl text-bone">
                        {cat.name}
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {items.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={isAvailableToday === false ? { ...item, is_available: false } : item}
                            unavailableLabel="Majita Monday only"
                          />
                        ))}
                      </div>
                    </div>

                    {categoryPhoto && (
                      <div className="relative mt-8 hidden h-64 shrink-0 overflow-hidden rounded-sm border border-bone/15 bg-ink/80 shadow-lg md:mt-14 md:block md:w-1/3">
                        <Image
                          src={categoryPhoto}
                          alt={cat.name}
                          fill
                          sizes="33vw"
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </main>
  );
}

function MajitaAvailabilityNotice({ isAvailableToday }: { isAvailableToday: boolean | null }) {
  if (isAvailableToday === null) {
    return (
      <div className="mb-10 border border-bone/20 bg-ink/60 px-6 py-4 text-center font-body text-sm text-bone/70">
        Checking today&apos;s Majita Monday availability...
      </div>
    );
  }

  if (isAvailableToday) {
    return (
      <div className="mb-10 border-2 border-char/60 bg-char/10 px-6 py-4 text-center">
        <p className="font-body font-bold uppercase tracking-wide text-char">Majita menu available today</p>
        <p className="mt-1 font-body text-sm text-bone/75">
          Today&apos;s special is open for ordering. Choose your plate and add any extras below.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10 border-2 border-flame bg-smoke px-6 py-4 text-center">
      <p className="font-body font-bold uppercase tracking-wide text-flame">Majita Monday runs every Monday</p>
      <p className="mt-1 font-body text-sm text-bone/75">
        You can browse the plates today, but ordering opens on Monday. If The Chicken Bar runs a special Majita day at another time, it will be announced here.
      </p>
    </div>
  );
}
