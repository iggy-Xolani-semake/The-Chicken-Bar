import { supabase } from "./client";
import type { MenuItem, MenuCategory, RestaurantEvent } from "./types";

/**
 * Fetch all active menu items for a given menu_type ('main' or 'majita_monday'),
 * with combo option groups/choices and addons joined in.
 *
 * Deliberately does NOT filter out is_available = false items here — the
 * brief is explicit: out-of-stock items must still be VISIBLE (shown as
 * "Out of Stock", not addable), never hidden. Availability filtering for
 * cart-eligibility happens at the component level, not the query level.
 * Filtering here would make it impossible to render the disabled state at all.
 */
export async function getMenuItems(
  menuType: "main" | "majita_monday" = "main"
): Promise<{ categories: MenuCategory[]; itemsByCategory: Record<string, MenuItem[]> }> {
  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("is_active", true)
    .eq("menu_type", menuType)
    .order("display_order", { ascending: true });

  if (catError) {
    throw new Error(`Failed to fetch menu categories: ${catError.message}`);
  }

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select(
      `
      *,
      combo_option_groups (
        *,
        combo_option_choices (*)
      ),
      menu_item_addons (*)
    `
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (itemError) {
    throw new Error(`Failed to fetch menu items: ${itemError.message}`);
  }

  const typedItems = (items ?? []) as unknown as MenuItem[];
  const typedCategories = (categories ?? []) as MenuCategory[];

  // Group items by category_id, only including items whose category
  // belongs to this menuType (the join above pulls all items regardless
  // of category's menu_type, so filter client-side against the category
  // list we already fetched)
  const categoryIds = new Set(typedCategories.map((c) => c.id));
  const itemsByCategory: Record<string, MenuItem[]> = {};

  for (const item of typedItems) {
    if (!categoryIds.has(item.category_id)) continue;
    if (!itemsByCategory[item.category_id]) {
      itemsByCategory[item.category_id] = [];
    }
    itemsByCategory[item.category_id].push(item);
  }

  return { categories: typedCategories, itemsByCategory };
}

/**
 * Fetch a curated set of featured items for the homepage "Today's Menu"
 * section. Only returns is_featured = true AND is_available = true items —
 * unlike getMenuItems above, it's correct to filter out unavailable items
 * here specifically because this is a promotional highlight section, not
 * the full orderable menu. An out-of-stock item has no business being
 * "featured" on the homepage.
 */
/**
 * Admin-curated shortlist for the homepage "Today's Special" section —
 * only items an admin has explicitly flagged is_todays_special=true,
 * NOT everything in whatever menu_type the day resolves to. Whether
 * the section shows at all is a separate decision (see
 * lib/todaysSpecial.ts / restaurant_settings.todays_special_override);
 * this function only decides which specific items appear once it does.
 */
export async function getTodaysSpecialItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      `
      *,
      combo_option_groups (
        *,
        combo_option_choices (*)
      ),
      menu_item_addons (*)
    `
    )
    .eq("is_active", true)
    .eq("is_todays_special", true)
    .eq("is_available", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch today's special items: ${error.message}`);
  }

  return (data ?? []) as unknown as MenuItem[];
}

export async function getFeaturedItems(limit = 3): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      `
      *,
      combo_option_groups (
        *,
        combo_option_choices (*)
      ),
      menu_item_addons (*)
    `
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured items: ${error.message}`);
  }

  return (data ?? []) as unknown as MenuItem[];
}

/**
 * Upcoming events, soonest first. status='upcoming' only — past events
 * are a separate query (getPastEvents) since the brief treats them as
 * a distinct archive, not just a filtered view of the same list.
 */
export async function getUpcomingEvents(limit = 6): Promise<RestaurantEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(`*, event_entertainment (*), event_images (*)`)
    .eq("status", "upcoming")
    .order("event_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch upcoming events: ${error.message}`);
  return (data ?? []) as unknown as RestaurantEvent[];
}

/**
 * Past events archive. Brief: "never automatically delete previous
 * events" — these are status='past' rows, not deleted rows.
 */
export async function getPastEvents(limit = 6): Promise<RestaurantEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(`*, event_entertainment (*), event_images (*)`)
    .eq("status", "past")
    .order("event_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch past events: ${error.message}`);
  return (data ?? []) as unknown as RestaurantEvent[];
}

/**
 * Single event by id, with entertainment and images joined. Used by the
 * event detail page. Returns null if not found rather than throwing —
 * a missing/deleted event is a normal "not found" case, not an error.
 */
export async function getEventById(id: string): Promise<RestaurantEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select(`*, event_entertainment (*), event_images (*)`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch event: ${error.message}`);
  return data as unknown as RestaurantEvent | null;
}
/**
 * Reads restaurant_settings.todays_special_override — null means "no
 * admin override, auto-detect by weekday" (see lib/todaysSpecial.ts for
 * the resolution logic). Settings is a singleton row, same assumption
 * the admin settings page already makes with .single().
 */
export async function getTodaysSpecialOverride(): Promise<"main" | "majita_monday" | null> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("todays_special_override")
    .single();

  if (error) throw new Error(`Failed to fetch today's special override: ${error.message}`);
  return (data?.todays_special_override as "main" | "majita_monday" | null) ?? null;
}