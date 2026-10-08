import type { CSSProperties } from "react";
import { toNumerals, type Lang } from "@/lib/i18n";
import type { MonthlyResponse } from "@/lib/miqaat";

/** "Rabiʿ al-Thani – Jumada al-Ula 1448" for the Hijri months a Gregorian month spans. */
export function hijriMonthSpan(monthly: MonthlyResponse, numerals: Lang): string {
  const first = monthly.days[0];
  const last = monthly.days[monthly.days.length - 1];
  if (!first || !last) return "";
  const y = (v: number) => toNumerals(String(v), numerals);
  if (first.hijri.monthName === last.hijri.monthName) return `${first.hijri.monthName} ${y(first.hijri.year)}`;
  if (first.hijri.year === last.hijri.year) {
    return `${first.hijri.monthName} – ${last.hijri.monthName} ${y(last.hijri.year)}`;
  }
  return `${first.hijri.monthName} ${y(first.hijri.year)} – ${last.hijri.monthName} ${y(last.hijri.year)}`;
}

/** Shown when the API returned no days for the chosen date. */
export function NoData({ style }: { style: CSSProperties }) {
  return (
    <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", padding: 64, textAlign: "center" }}>
      <p style={{ fontSize: 34, opacity: 0.7 }}>No prayer times available for this location yet.</p>
    </div>
  );
}
