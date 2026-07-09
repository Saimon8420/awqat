import type { DayTimes, MonthlyResponse } from "@/lib/miqaat";

// LANG_FONT_CLASS/PRAYER_ROW_KEYS/ROW_LABEL_KEYS live in ../shared so monthly
// templates can reuse them without duplicating the constants; re-exported
// here so daily templates' existing `./shared` imports keep working.
export { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS, type PrayerRowKey } from "../shared";

/**
 * Picks "today" from a fetched month: the day whose `dateISO` matches the
 * current date in the schedule's own timezone (not the browser's local
 * date, which can differ near midnight). Falls back to the first day of
 * the month when today isn't present (e.g. the fetched month isn't the
 * current one), and to `undefined` when the month has no days at all.
 */
export function pickToday(monthly: MonthlyResponse): DayTimes | undefined {
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: monthly.location.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return monthly.days.find((d) => d.dateISO === todayISO) ?? monthly.days[0];
}
