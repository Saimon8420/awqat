import { useEffect, useState, type CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { inDuration, label, toNumerals, type Lang } from "@/lib/i18n";
import type { DayTimes, MonthlyResponse } from "@/lib/miqaat";
import type { StudioState } from "@/lib/state";
import { pickToday } from "../daily/shared";
import { PRAYER_ROW_KEYS, type PrayerRowKey } from "../shared";

export { PRAYER_ROW_KEYS, type PrayerRowKey };

/** Display face for headings: the bundled serif for Latin, the script font otherwise. */
export function displayFont(lang: Lang, latin = "var(--font-serif)"): string {
  if (lang === "bn") return "var(--font-bengali)";
  if (lang === "ar") return "var(--font-arabic)";
  return latin;
}

/** Body face per language. */
export function bodyFont(lang: Lang): string {
  if (lang === "bn") return "var(--font-bengali)";
  if (lang === "ar") return "var(--font-arabic)";
  return "var(--font-latin)";
}

export const ARABIC_FONT = "var(--font-arabic)";

/**
 * Size multiplier for the daily card so one layout serves every export ratio:
 * the tall Story (9:16) is the design size; Post (4:5) and Square (1:1) shrink
 * the vertical rhythm so everything still fits.
 */
export function ratioScale(state: StudioState): number {
  if (state.format !== "daily") return 1;
  if (state.exportRatio === "square") return 0.6;
  if (state.exportRatio === "post") return 0.74;
  return 1;
}

/** Splits "4:28 PM" into its clock and meridiem so designs can size them apart. */
export function splitTime(formatted: string): { clock: string; meridiem: string } {
  const m = formatted.match(/^(.*?)\s?(AM|PM)$/);
  return m ? { clock: m[1], meridiem: m[2] } : { clock: formatted, meridiem: "" };
}

/** Re-renders every `ms` so moment-in-time text (the next-prayer countdown) stays current. */
export function useNow(ms = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function isoToday(tz: string, nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

/** Gregorian date in the card's language, with digits in the chosen numeral system. */
export function gregorianText(dateISO: string, lang: Lang, numerals: Lang, style: "long" | "short" = "long"): string {
  const date = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`);
  const text = new Intl.DateTimeFormat(`${lang}-u-nu-latn`, {
    weekday: style,
    day: "numeric",
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return toNumerals(text, numerals);
}

export function hijriText(day: DayTimes, numerals: Lang): string {
  const { hijri } = day;
  return `${toNumerals(String(hijri.day), numerals)} ${hijri.monthName} ${toNumerals(String(hijri.year), numerals)}`;
}

/** Short Hijri month names for the dense tables ("Rabi' al-Thani" → "Rab II"). */
export function hijriMonthShort(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith("muharram")) return "Muh";
  if (n.startsWith("safar")) return "Saf";
  if (n.includes("rabi")) return n.includes("awwal") ? "Rab I" : "Rab II";
  if (n.includes("jumad") && (n.includes("ula") || n.includes("awwal"))) return "Jum I";
  if (n.includes("jumad")) return "Jum II";
  if (n.startsWith("rajab")) return "Raj";
  if (n.startsWith("sha")) return n.startsWith("shaw") ? "Shaw" : "Sha";
  if (n.startsWith("ramadan")) return "Ram";
  if (n.includes("qi")) return "Dhul Q";
  if (n.includes("hij")) return "Dhul H";
  return name.slice(0, 5);
}

export type NextPrayer = { key: PrayerRowKey; inText: string } | null;

/**
 * Everything a daily card needs about its day: formatted times, dates, which
 * prayer is current and which is next (only when the card shows today — a
 * countdown on any other date would be meaningless).
 */
export function useDailyData(monthly: MonthlyResponse, state: StudioState) {
  const now = useNow();
  const today = pickToday(monthly, state);
  const tz = monthly.location.timezone;
  const fmt = (iso: string) =>
    splitTime(formatTime(iso, { hour12: state.hour12, lang: state.numerals, timezone: tz }));
  const rows = PRAYER_ROW_KEYS.filter((k) => state.showRows[k] !== false);

  let current: PrayerRowKey | null = null;
  let next: NextPrayer = null;
  let nextKey: PrayerRowKey | null = null;

  const isToday = today ? today.dateISO === isoToday(tz, now) : false;
  if (today && isToday) {
    const order = PRAYER_ROW_KEYS.map((k) => ({ k, ms: new Date(today.prayers[k]).getTime() }));
    const idx = order.findIndex((e) => e.ms > now);
    if (idx === -1) {
      current = "isha";
      const i = monthly.days.findIndex((d) => d.dateISO === today.dateISO);
      const tomorrow = monthly.days[i + 1];
      nextKey = "fajr";
      if (tomorrow) {
        next = {
          key: "fajr",
          inText: inDuration(new Date(tomorrow.prayers.fajr).getTime() - now, state.lang, state.numerals),
        };
      }
    } else {
      current = idx === 0 ? "isha" : order[idx - 1].k;
      nextKey = order[idx].k;
      next = { key: order[idx].k, inText: inDuration(order[idx].ms - now, state.lang, state.numerals) };
    }
  }

  return { today, tz, fmt, rows, current, next, nextKey, isToday };
}

/** True when the shown day falls inside Ramadan. */
export function isRamadanDay(day: DayTimes | undefined): boolean {
  return day?.hijri.monthName === "Ramadan";
}

/** The Masjid-mode mark: the uploaded logo, or the name's first letter in a badge. */
export function OrgMark({
  logo,
  name,
  size,
  bg,
  color,
  radius = "50%",
  border,
}: {
  logo?: string;
  name: string;
  size: number;
  bg: string;
  color: string;
  radius?: string;
  border?: string;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    background: bg,
    border,
    flex: "none",
  };
  if (logo) return <img src={logo} alt="" style={{ ...style, objectFit: "cover" }} />;
  return (
    <div
      style={{
        ...style,
        color,
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: size * 0.46,
        fontFamily: "var(--font-serif)",
      }}
    >
      {(name || "M").slice(0, 1).toUpperCase()}
    </div>
  );
}

/** The verse on prayer times (An-Nisa 4:103), used by the Daylight card. */
export const AYAH_ARABIC = "إِنَّ ٱلصَّلَوٰةَ كَانَتْ عَلَى ٱلْمُؤْمِنِينَ كِتَٰبًا مَّوْقُوتًا";
export const AYAH_TRANSLATION: Record<Lang, { text: string; ref: string }> = {
  en: { text: "“Indeed, prayer is prescribed for the believers at fixed times.”", ref: "An-Nisa 4:103" },
  bn: { text: "“নিশ্চয়ই নির্ধারিত সময়ে নামাজ আদায় করা মুমিনদের জন্য ফরজ।”", ref: "সূরা নিসা ৪:১০৩" },
  ar: { text: "", ref: "سورة النساء ١٠٣" },
};

/** The localized prayer name, plus its Arabic name when the card isn't already in Arabic. */
export function prayerNames(key: PrayerRowKey, lang: Lang): { name: string; arabic: string | null } {
  return { name: label(key, lang), arabic: lang === "ar" ? null : label(key, "ar") };
}

/** "Method: X · Y" — every export states how its times were calculated. */
export function methodText(monthly: MonthlyResponse): string {
  return `Method: ${monthly.method} · ${monthly.madhab}`;
}

/** 8-bit alpha suffix for a 6-digit hex colour. */
export function alpha(hex: string, a: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return `${hex}${Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
