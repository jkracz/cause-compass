/**
 * Returns an ISO 8601 week key (e.g. `"2026-W17"`) for a given date.
 *
 * Used as the seed for editorial selections like Cause of the Week and
 * Editor's Picks so they roll over on a Monday-to-Sunday cadence and stay
 * stable for everyone visiting the site within the same week.
 *
 * Notes:
 * - Computed in **UTC** so users in different timezones see the same key
 *   (avoids the picks shifting around at midnight local time).
 * - Follows the ISO 8601 definition: weeks start on Monday, and the first
 *   week of a year is the one containing the first Thursday — so a date
 *   in early January can return e.g. `2025-W53`.
 *
 * @param date Date to derive the week from. Defaults to `new Date()`.
 * @returns A string of the form `YYYY-Www`, zero-padded to two digits.
 *
 * @example
 * getWeekKey(new Date("2026-04-22")); // "2026-W17"
 */
export function getWeekKey(date: Date = new Date()): string {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - firstThursdayDayNumber + 3,
  );
  const week =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
