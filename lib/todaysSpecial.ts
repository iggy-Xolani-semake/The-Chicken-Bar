/**
 * "Today's Special" resolution logic.
 *
 * Default behaviour: Monday -> majita_monday menu, every other day -> no
 * special (section hides). Admin can override this via
 * restaurant_settings.todays_special_override, which forces a specific
 * menu_type regardless of the actual weekday — e.g. running the Majita
 * Monday menu on a Tuesday public holiday, or turning it off on a Monday
 * the kitchen isn't doing it.
 *
 * Date is a parameter (not read internally via `new Date()`), same as
 * isOrderingOpen in orderHours.ts, so this is unit-testable against fixed
 * points in time rather than depending on whenever the test happens to run.
 */

export type MenuType = "main" | "majita_monday";

/** Mirrors restaurant_settings.todays_special_override: null = auto-detect. */
export type TodaysSpecialOverride = MenuType | null;

/**
 * Resolves which menu_type (if any) should be shown as "Today's Special".
 * Returns null when there's no special to show — callers should hide the
 * section entirely in that case, not render an empty state.
 */
export function resolveTodaysSpecial(
  now: Date,
  override: TodaysSpecialOverride
): MenuType | null {
  if (override !== null) return override;

  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return day === 1 ? "majita_monday" : null;
}

/** Display label for a resolved menu_type, used in the section heading. */
export function todaysSpecialLabel(menuType: MenuType): string {
  return menuType === "majita_monday" ? "Majita Monday" : "Today's Special";
}
