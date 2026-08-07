/**
 * Order hours logic. Per brief:
 * MON-THU 11:00-20:00, FRI-SUN 11:00-21:00.
 * Outside these hours, order SUBMISSION is disabled but menu browsing
 * stays open — this function only gates the checkout/submit action,
 * never used to hide the menu itself.
 *
 * Hours are read from restaurant_settings (admin-editable per brief),
 * not hardcoded — this function takes them as parameters so it can be
 * driven by live settings data, with the brief's stated defaults used
 * only as fallback values by the caller, not baked into this function.
 */

export interface OrderHoursConfig {
  monThuOpen: string; // "HH:MM" 24hr format
  monThuClose: string;
  friSunOpen: string;
  friSunClose: string;
}

export const DEFAULT_ORDER_HOURS: OrderHoursConfig = {
  monThuOpen: "11:00",
  monThuClose: "20:00",
  friSunOpen: "11:00",
  friSunClose: "21:00",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Returns whether ordering is currently open, given a specific Date and
 * hours config. Date is a parameter (not read internally via `new Date()`)
 * specifically so this is unit-testable against fixed points in time
 * rather than depending on whenever the test happens to run.
 */
export function isOrderingOpen(now: Date, config: OrderHoursConfig): boolean {
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const isMonThu = day >= 1 && day <= 4; // Monday(1) through Thursday(4)
  const isFriSun = day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday

  if (isMonThu) {
    return (
      nowMinutes >= timeToMinutes(config.monThuOpen) &&
      nowMinutes < timeToMinutes(config.monThuClose)
    );
  }

  if (isFriSun) {
    return (
      nowMinutes >= timeToMinutes(config.friSunOpen) &&
      nowMinutes < timeToMinutes(config.friSunClose)
    );
  }

  // Should be unreachable — every day falls into one of the two branches
  // above. Defaulting closed rather than open if this is ever hit, since
  // failing closed is the safer default for a business-hours gate.
  return false;
}

/**
 * Human-readable message for why ordering is closed, and when it reopens.
 * Kept separate from isOrderingOpen so the boolean check and the display
 * string can be tested/used independently.
 */
export function getOrderingClosedMessage(now: Date, config: OrderHoursConfig): string {
  const day = now.getDay();
  const isMonThu = day >= 1 && day <= 4;
  const openTime = isMonThu ? config.monThuOpen : config.friSunOpen;
  return `Orders open at ${openTime}.`;
}
