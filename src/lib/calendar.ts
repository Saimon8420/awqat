import type { DayTimes, MonthlyResponse } from "./miqaat";
import type { Lang } from "./i18n";

export type SpecialType =
  | "ramadan"
  | "laylat-al-qadr"
  | "white-day"
  | "eid-al-fitr"
  | "eid-al-adha"
  | "ashura";

// Miqaat's confirmed live spelling ("Dhu al-Hijjah") kept first; other common
// transliterations accepted case-insensitively as a fallback.
const DHUL_HIJJAH_SPELLINGS = [
  "dhu al-hijjah",
  "dhul hijjah",
  "dhul-hijjah",
  "dhu'l-hijjah",
];

function isDhulHijjah(monthName: string): boolean {
  return DHUL_HIJJAH_SPELLINGS.includes(monthName.trim().toLowerCase());
}

export function isRamadanMonth(days: DayTimes[]): boolean {
  if (days.length === 0) return false;
  const ramadanCount = days.filter((d) => d.hijri.monthName === "Ramadan").length;
  return ramadanCount > days.length / 2;
}

export function specialDaysForMonth(days: DayTimes[]): Record<string, SpecialType[]> {
  const result: Record<string, SpecialType[]> = {};

  for (const d of days) {
    const { day, monthName } = d.hijri;
    const types: SpecialType[] = [];
    const isRamadan = monthName === "Ramadan";

    if (isRamadan && [21, 23, 25, 27, 29].includes(day)) types.push("laylat-al-qadr");
    if (day === 1 && monthName === "Shawwal") types.push("eid-al-fitr");
    if (day === 10 && isDhulHijjah(monthName)) types.push("eid-al-adha");
    if (day === 10 && monthName === "Muharram") types.push("ashura");
    if (isRamadan) types.push("ramadan");
    if ([13, 14, 15].includes(day)) types.push("white-day");

    if (types.length > 0) result[d.dateISO] = types;
  }

  return result;
}

export async function ramadanMonthOfYear(
  getMonthlyFn: (p: {
    lat: number;
    lon: number;
    year: number;
    month: number;
  }) => Promise<MonthlyResponse>,
  loc: { lat: number; lon: number },
  year: number,
): Promise<number | null> {
  for (let month = 1; month <= 12; month++) {
    const monthly = await getMonthlyFn({ lat: loc.lat, lon: loc.lon, year, month });
    if (isRamadanMonth(monthly.days)) return month;
  }
  return null;
}

export function dayLabel(d: DayTimes): { gregDay: number; hijriDay: number } {
  return {
    gregDay: Number(d.dateISO.slice(8, 10)),
    hijriDay: d.hijri.day,
  };
}

const WEEKDAY_LOCALE: Record<Lang, string> = { en: "en", bn: "bn", ar: "ar" };

/**
 * Localized weekday name for a day's ISO date, e.g. "Wed" / "বুধ" / "الأربعاء"
 * (`short`) or "W" / "ব" / "أ" (`narrow`). The ISO date is parsed as a UTC
 * calendar date so the weekday is fixed by the date itself and never shifts
 * with the viewer's own timezone. Returned as a plain string — no numeral
 * conversion needed (it's text, not digits).
 *
 * `short` is used on the roomy monthly tables; the ultra-dense year grid uses
 * `narrow` (single glyph) so the tiny day cell can carry a weekday + hijri day
 * without overflowing.
 */
export function weekdayName(
  dateISO: string,
  lang: Lang,
  style: "short" | "long" | "narrow" = "short",
): string {
  const date = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat(WEEKDAY_LOCALE[lang], {
    weekday: style,
    timeZone: "UTC",
  }).format(date);
}
