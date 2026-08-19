/**
 * Event countdown logic. Pure and testable — `now` is a parameter, not
 * read internally via `new Date()`, same pattern as isOrderingOpen in
 * orderHours.ts and resolveTodaysSpecial in todaysSpecial.ts.
 *
 * Dates are compared at the calendar-day level (midnight to midnight),
 * not to the second — "3 days away" shouldn't flicker to "2 days away"
 * at some arbitrary hour before the event actually starts that day.
 */

export interface EventCountdown {
  daysUntil: number;
  label: string;
}

/**
 * eventDateStr is a "YYYY-MM-DD" date (matches the events.event_date
 * column, which has no time component). Parsed as local midnight, same
 * approach UpcomingEvents.tsx and the event detail page already use for
 * formatEventDate, so the countdown and the displayed date never
 * disagree about which calendar day the event falls on.
 */
export function getEventCountdown(now: Date, eventDateStr: string): EventCountdown {
  const eventDate = new Date(eventDateStr + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.round((eventDay.getTime() - today.getTime()) / msPerDay);

  return { daysUntil, label: countdownLabel(daysUntil) };
}

function countdownLabel(daysUntil: number): string {
  if (daysUntil < 0) return "Past";
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days to go`;
}
