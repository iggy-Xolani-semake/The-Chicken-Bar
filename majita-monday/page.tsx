"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMenuItems } from "@/lib/supabase/queries";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "@/app/components/MenuItemCard";
import {
  isMajitaMondayOrderingOpen,
  getMajitaMondayClosedMessage,
  DEFAULT_ORDER_HOURS,
} from "@/lib/orderHours";

export default function MajitaMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMenuItems("majita_monday")
      .then(({ categories, itemsByCategory }) => {
        setCategories(categories);
        setItemsByCategory(itemsByCategory);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  // Menu always stays visible/browsable per brief — this banner is
  // informational only, doesn't hide or disable anything below it.
  // Actual submission blocking happens at checkout (CheckoutForm.tsx),
  // since that's the one place that knows the full cart.
  const majitaOrderingOpen = isMajitaMondayOrderingOpen(new Date(), DEFAULT_ORDER_HOURS);
  const majitaClosedMessage = getMajitaMondayClosedMessage(DEFAULT_ORDER_HOURS);

  return (
    <main>
      <section className="texture-wood texture-wood-majita texture-wood-overlay relative px-6 md:px-12 py-20 border-b-4 border-flame overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(232,121,31,0.25) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Image
            src="/logo/majita-wordmark-white.png"
            alt="Majita Monday — Ox Liver, Pork Trotter, Mogodu"
            width={1511}
            height={512}
            priority
            className="mx-auto w-full max-w-md h-auto mb-6"
          />
          <p className="font-body text-bone/70 text-lg">
            Majita Monday isn&apos;t a scheduled event — it&apos;s people
            coming together informally to share a meal and conversation.
          </p>

          {!majitaOrderingOpen && (
            <div
              role="alert"
              className="mt-6 bg-ember/10 border border-ember/40 rounded-sm p-4 text-center max-w-lg mx-auto"
            >
              <p className="font-body font-bold text-ember uppercase tracking-wide text-sm">
                Orders open Monday
              </p>
              <p className="font-body text-bone/70 text-sm mt-1">{majitaClosedMessage}</p>
            </div>
          )}
        </div>
      </section>

      <div className="texture-wood texture-wood-majita texture-wood-overlay px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          {error && <p className="text-center font-body text-bone/60">Couldn&apos;t load the menu.</p>}

          {!error && categories === null && (
            <p className="text-center font-body text-bone/50">Loading menu...</p>
          )}

          {!error &&
            categories?.map((cat) => {
              const items = itemsByCategory[cat.id] ?? [];
              if (items.length === 0) return null;

              // Real photo, if one exists for this category — pulled from
              // whichever item in the category already has a real
              // image_url set in the database, rather than a hardcoded
              // filename guess. No fake/generic photo shown if none
              // exists yet; the grid just runs full-width, same as
              // before. Once real mogodu/trotter/liver photos get linked
              // via the admin panel, this fills in on its own.
              const categoryPhoto = items.find((i) => i.image_url)?.image_url;

              return (
                <section key={cat.id} className="mb-14">
                  <div className={`flex flex-col ${categoryPhoto ? "md:flex-row md:gap-8" : ""} items-start`}>
                    <div className={categoryPhoto ? "md:w-2/3" : "w-full"}>
                      <h2 className="font-display text-bone text-3xl mb-6">{cat.name}</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <MenuItemCard key={item.id} item={item} menuType="majita_monday" />
                        ))}
                      </div>
                    </div>

                    {categoryPhoto && (
                      <div className="hidden md:block md:w-1/3 shrink-0 pt-14">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={categoryPhoto}
                          alt={cat.name}
                          className="w-full h-64 object-cover rounded-sm shadow-lg"
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
