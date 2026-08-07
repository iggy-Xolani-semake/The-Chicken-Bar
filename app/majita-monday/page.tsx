"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMenuItems } from "@/lib/supabase/queries";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "@/app/components/MenuItemCard";

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
              return (
                <section key={cat.id} className="mb-14">
                  <h2 className="font-display text-bone text-3xl mb-6">{cat.name}</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </main>
  );
}
