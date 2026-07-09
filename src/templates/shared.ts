import type { Lang, LabelKey } from "@/lib/i18n";

/**
 * Font utility class per calendar language, keyed identically to
 * src/fonts/fonts.css's `.font-latin|.font-bengali|.font-arabic` classes.
 *
 * Shared across daily and monthly templates — re-exported from
 * `daily/shared.ts` so existing daily template imports keep working.
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

/** `i18n` label key for each prayer row, in the same order as PRAYER_ROW_KEYS. */
export const ROW_LABEL_KEYS: Record<PrayerRowKey, LabelKey> = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};
