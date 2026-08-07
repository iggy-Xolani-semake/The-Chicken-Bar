// Types mirror the executed schema in 01_settings_and_menu.sql exactly.
// If a column is added/renamed in a migration, update here too — these
// are hand-written, not auto-generated, so drift is possible if this
// file isn't kept in sync with schema changes.

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  menu_type: "main" | "majita_monday";
  created_at: string;
}

export interface ComboOptionChoice {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  display_order: number;
}

export interface ComboOptionGroup {
  id: string;
  menu_item_id: string;
  name: string;
  min_select: number;
  max_select: number;
  display_order: number;
  // populated by the query join, not a real column
  combo_option_choices: ComboOptionChoice[];
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  item_type: "simple" | "combo";
  contents_description: string | null;
  contents_confirmed: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // populated by query joins, not real columns on this table
  combo_option_groups: ComboOptionGroup[];
  menu_item_addons: MenuItemAddon[];
}

export interface EventEntertainment {
  id: string;
  event_id: string;
  role: "dj" | "artist" | "mc" | "host" | "performer";
  name: string;
  photo_url: string | null;
  social_link: string | null;
  set_time: string | null;
  display_order: number;
}

export interface EventImage {
  id: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

export interface RestaurantEvent {
  id: string;
  name: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  entry_type: "free" | "paid";
  ticket_price_from: number | null;
  ticket_info: string | null;
  whatsapp_number_override: string | null;
  is_featured: boolean;
  status: "upcoming" | "past" | "cancelled";
  event_entertainment: EventEntertainment[];
  event_images: EventImage[];
}
