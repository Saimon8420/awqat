import type { MonthlyResponse } from "./miqaat";

/** Month names exactly as the Miqaat API writes them, so adjusted dates read the same. */
const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

export const HIJRI_ADJUST_MIN = -2;
export const HIJRI_ADJUST_MAX = 2;

const umalqura = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The Hijri date for a Gregorian date, `shift` days on. Uses the Umm al-Qura
 * calendar, the same one the Miqaat API uses, so a shift of 0 matches it.
 */
export function hijriFor(dateISO: string, shift: number): { day: number; monthName: string; year: number } {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + shift);
  const parts = Object.fromEntries(umalqura.formatToParts(d).map((p) => [p.type, p.value]));
  return { day: Number(parts.day), monthName: HIJRI_MONTHS[Number(parts.month) - 1], year: Number(parts.year) };
}

/**
 * Moon sighting differs by country (Bangladesh is often a day behind Saudi
 * Arabia), so the user can move every Hijri date by a day or two. Prayer
 * times don't change; only the Hijri dates, and everything derived from them
 * (Ramadan nights, Eid, white days), move.
 */
export function adjustHijri(monthly: MonthlyResponse, shift: number): MonthlyResponse {
  if (!shift) return monthly;
  return { ...monthly, days: monthly.days.map((day) => ({ ...day, hijri: hijriFor(day.dateISO, shift) })) };
}
