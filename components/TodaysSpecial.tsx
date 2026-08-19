"use client";

import { useEffect, useState } from "react";
import { getTodaysSpecialOverride, getMenuItems } from "@/lib/supabase/queries";
import { resolveTodaysSpecial, todaysSpecialLabel, type MenuType } from "@/lib/todaysSpecial";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";
import MenuItemCard from "./MenuItemCard";

/**
 * "Today's Special" homepage section. Defaults to the Majita Monday menu
 * every Monday, hides entirely on other days — unless an admin has set
 * restaurant_settings.todays_special_override (see /admin/settings),
 * which forces a specific menu_type regardless of weekday.
 *
 * Deliberately renders nothing (not an empty state) when there's no
 * special today — this is a highlight section, not a permanent fixture
 * like the full menu. An empty "Today's Special" box on a Tuesday would
 * read as broken, not informative.
 */
export default function TodaysSpecial() {
  const [resolvedMenuType, setResolvedMenuType] = useState<MenuType | null | "loading">(
    "loading"
  );
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTodaysSpecialOverride()
      .then((override) => {
        const menuType = resolveTodaysSpecial(new Date(), override);
        if (cancelled) return;
        setResolvedMenuType(menuType);

        if (menuType === null) return;

        return getMenuItems(menuType).then(({ categories, itemsByCategory }) => {
          if (cancelled) return;
          setCategories(categories);
          setItemsByCategory(itemsByCategory);
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

  const items = categories.flatMap((cat) => itemsByCategory[cat.id] ?? []);
  if (items.length === 0) return null; // menu_type resolved but nothing's populated yet

  return (
    <section className="bg-smoke px-6 md:px-12 py-20 md:py-28 border-y-4 border-flame">
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
