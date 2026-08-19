"use client";

import { useEffect, useState } from "react";
import { getTodaysSpecialOverride, getTodaysSpecialItems } from "@/lib/supabase/queries";
import { resolveTodaysSpecial, todaysSpecialLabel, type MenuType } from "@/lib/todaysSpecial";
import type { MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "./MenuItemCard";

/**
 * "Today's Special" homepage section. Whether it shows at all follows
 * the weekday/override logic in lib/todaysSpecial.ts (Monday by
 * default, admin-overridable in /admin/settings). Which items appear
 * is a SEPARATE decision — only items an admin has explicitly flagged
 * is_todays_special=true in /admin/menu, not the entire main or Majita
 * Monday menu. Earlier this pulled every item in the resolved
 * menu_type, which meant the whole menu (Chicken, Burgers, Dagwoods,
 * Wraps, Meals, Combos, Kota, Sides, Buy & Braai — everything) showed
 * up here; that was wrong, this is a curated highlight, same idea as
 * the existing "Feature" flag elsewhere in the admin panel.
 *
 * Deliberately renders nothing (not an empty state) when there's no
 * special today, or when today is a special day but nothing has been
 * flagged yet — this is a highlight section, not a permanent fixture
 * like the full menu. An empty "Today's Special" box would read as
 * broken, not informative.
 */
export default function TodaysSpecial() {
  const [resolvedMenuType, setResolvedMenuType] = useState<MenuType | null | "loading">(
    "loading"
  );
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTodaysSpecialOverride()
      .then((override) => {
        const menuType = resolveTodaysSpecial(new Date(), override);
        if (cancelled) return;
        setResolvedMenuType(menuType);

        if (menuType === null) return;

        return getTodaysSpecialItems().then((items) => {
          if (cancelled) return;
          setItems(items);
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Still resolving, or resolved to "nothing today" — render nothing.
  if (resolvedMenuType === "loading" || resolvedMenuType === null) return null;
  if (error) return null; // fail quiet — this is a highlight section, not critical path
  if (items.length === 0) return null; // today qualifies, but nothing's been flagged yet

  return (
    <section className="texture-wood texture-wood-todays-special texture-wood-overlay px-6 md:px-12 py-20 md:py-28 border-y-4 border-flame">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-utility text-char text-sm tracking-[0.3em] uppercase mb-3">
            On today
          </p>
          <h2 className="font-display text-bone text-5xl md:text-6xl">
            {todaysSpecialLabel(resolvedMenuType)}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
