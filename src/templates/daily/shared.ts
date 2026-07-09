import type { DayTimes, MonthlyResponse } from "@/lib/miqaat";

// LANG_FONT_CLASS/PRAYER_ROW_KEYS/ROW_LABEL_KEYS live in ../shared so monthly
// templates can reuse them without duplicating the constants; re-exported
// here so daily templates' existing `./shared` imports keep working.
export { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS, type PrayerRowKey } from "../shared";

/**
 * Picks the day to display from a fetched month.
 *
 * When `selected` (typically `state`'s `year`/`month`/`day`) points at a
 * date present in `monthly.days`, that day wins — this is how the Studio's
 * date controls (Task 14) let a user preview an arbitrary day rather than
 * always "today". Otherwise falls back to the day whose `dateISO` matches
 * the current date in the schedule's own timezone (not the browser's local
 * date, which can differ near midnight), and finally to the first day of
 * the month when neither is present (e.g. the fetched month isn't the
 * current one). Returns `undefined` when the month has no days at all.
 */
export function pickToday(
  monthly: MonthlyResponse,
  selected?: { year?: number; month?: number; day?: number },
): DayTimes | undefined {
  if (selected?.year !== undefined && selected?.month !== undefined && selected?.day !== undefined) {
    const iso = `${selected.year}-${String(selected.month).padStart(2, "0")}-${String(
      selected.day,
    ).padStart(2, "0")}`;
    const match = monthly.days.find((d) => d.dateISO === iso);
    if (match) return match;
  }

  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: monthly.location.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return monthly.days.find((d) => d.dateISO === todayISO) ?? monthly.days[0];
}
