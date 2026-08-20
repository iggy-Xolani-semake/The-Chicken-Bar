import type { OrderHoursConfig } from "./orderHours";

export interface KotaBarHoursConfig extends OrderHoursConfig {
  kotaOrderOpen: string;
  kotaOrderClose: string;
}

export interface MenuAvailability {
  isOrderable: boolean;
  message: string | null;
}

export const DEFAULT_KOTA_BAR_HOURS: KotaBarHoursConfig = {
  monThuOpen: "11:00",
  monThuClose: "20:00",
  friSunOpen: "11:00",
  friSunClose: "21:00",
  kotaOrderOpen: "07:00",
  kotaOrderClose: "18:00",
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function getSouthAfricaClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    day: weekdayMap[value("weekday")] ?? 0,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function mainKitchenHoursForDay(now: Date, config: KotaBarHoursConfig): { open: string; close: string } {
  const { day } = getSouthAfricaClock(now);
  return day >= 1 && day <= 4
    ? { open: config.monThuOpen, close: config.monThuClose }
    : { open: config.friSunOpen, close: config.friSunClose };
}

/**
 * Availability for main-menu categories only. Majita Monday has its own
 * page/day rule and intentionally does not pass through this helper.
 */
export function getMainCategoryAvailability(
  now: Date,
  categorySlug: string,
  config: KotaBarHoursConfig
): MenuAvailability {
  const { minutes: nowMinutes } = getSouthAfricaClock(now);

  if (categorySlug === "kota") {
    const opensAt = timeToMinutes(config.kotaOrderOpen);
    const closesAt = timeToMinutes(config.kotaOrderClose);

    if (nowMinutes < opensAt) {
      return { isOrderable: false, message: `Kota orders open at ${formatTime(config.kotaOrderOpen)}.` };
    }
    if (nowMinutes >= closesAt) {
      return { isOrderable: false, message: `Kota orders close at ${formatTime(config.kotaOrderClose)}.` };
    }
    return { isOrderable: true, message: null };
  }

  const kitchen = mainKitchenHoursForDay(now, config);
  if (nowMinutes < timeToMinutes(kitchen.open)) {
    return {
      isOrderable: false,
      message: `Main kitchen orders open at ${formatTime(kitchen.open)}. The Kota Bar is available from ${formatTime(config.kotaOrderOpen)}.`,
    };
  }
  if (nowMinutes >= timeToMinutes(kitchen.close)) {
    return { isOrderable: false, message: `Main kitchen orders closed at ${formatTime(kitchen.close)}.` };
  }
  return { isOrderable: true, message: null };
}

/** Returns whether an order line can still be accepted by the main-menu rules. */
export function isMainCategoryOrderable(now: Date, categorySlug: string, config: KotaBarHoursConfig): boolean {
  return getMainCategoryAvailability(now, categorySlug, config).isOrderable;
}

export interface CartItemCategory {
  slug: string;
  menuType: "main" | "majita_monday";
}

/**
 * Majita Monday is intentionally excluded from the Kota/main-menu schedule
 * because its own page already applies its separate Monday rule.
 */
export function getCartAvailability(
  now: Date,
  categories: Array<CartItemCategory | undefined>,
  config: KotaBarHoursConfig
): MenuAvailability {
  for (const category of categories) {
    if (!category) {
      return { isOrderable: false, message: "Checking the availability of your order..." };
    }
    if (category.menuType === "majita_monday") continue;

    const availability = getMainCategoryAvailability(now, category.slug, config);
    if (!availability.isOrderable) return availability;
  }

  return { isOrderable: true, message: null };
}
