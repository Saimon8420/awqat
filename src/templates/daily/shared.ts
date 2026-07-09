import type { DayTimes, MonthlyResponse } from "@/lib/miqaat";
import type { Lang } from "@/lib/i18n";

/**
 * Font utility class per calendar language, keyed identically to
 * src/fonts/fonts.css's `.font-latin|.font-bengali|.font-arabic` classes.
 */
export const LANG_FONT_CLASS: Record<Lang, string> = {
  en: "font-latin",
  bn: "font-bengali",
  ar: "font-arabic",
};

/** The five daily prayers + Sunrise, in display order. */
export const PRAYER_ROW_KEYS = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export type PrayerRowKey = (typeof PRAYER_ROW_KEYS)[number];

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
