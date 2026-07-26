import { memo, type CSSProperties } from "react";
import type { MonthlyResponse } from "@/lib/miqaat";
import type { Lang } from "@/lib/i18n";
import type { ThemeTokens } from "../themes";
import { formatTime } from "@/lib/format";
import { label, toNumerals } from "@/lib/i18n";
import { dayLabel, weekdayName } from "@/lib/calendar";

/**
 * The shared 12-month grid used by both year posters — the personal
 * "Year Overview" and the organization variant differ only in their header,
 * so the grid, month panels, and their helpers live here and are rendered by
 * both. (The monthly templates each own their table because their columns
 * differ; the year panels are identical across lanes, so they're shared.)
 */

export const MONTH_COUNT = 12;

/** Localized Gregorian month name for `month` (1-12), via Intl so no manual translation table is needed. */
export function monthName(month: number, lang: Lang): string {
  const locale = lang === "ar" ? "ar" : lang === "bn" ? "bn" : "en";
  const date = new Date(Date.UTC(2000, month - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(date);
}

/** Min-max Hijri year(s) spanned across every fetched month's days, e.g. "1447 AH" or "1447-1448 AH". */
export function hijriYearSpan(months: MonthlyResponse[]): string | null {
  let min: number | undefined;
  let max: number | undefined;
  for (const m of months) {
    for (const d of m.days) {
      const y = d.hijri.year;
      if (min === undefined || y < min) min = y;
      if (max === undefined || y > max) max = y;
    }
  }
  if (min === undefined || max === undefined) return null;
  return min === max ? `${min} AH` : `${min}–${max} AH`;
}

type MonthPanelProps = {
  monthIndex: number;
  monthly: MonthlyResponse | undefined;
  lang: Lang;
  numerals: Lang;
  hour12: boolean;
  theme: ThemeTokens;
  accent: string;
};

/**
 * One compact panel of the year grid: a month-name header plus a dense
 * mini-table of that month's days, limited to day + Sehri + Iftar + Fajr +
 * Maghrib (the full daily set of 8 columns doesn't fit at this scale).
 * Renders a small placeholder when `monthly` hasn't loaded yet (partial
 * `months` results) or has no days.
 *
 * Memoized: the year grid re-renders whenever any studio state changes, but
 * a panel's output depends only on its own (referentially stable) props — so
 * editing e.g. the org name or greeting no longer re-renders all 12 dense
 * tables, which is what made typing lag on this heavy poster.
 */
const MonthPanel = memo(function MonthPanel({
  monthIndex,
  monthly,
  lang,
  numerals,
  hour12,
  theme,
  accent,
}: MonthPanelProps) {
  const name = monthName(monthIndex, lang);

  const panelStyle: CSSProperties = {
    borderColor: `${theme.fg}22`,
    borderWidth: 1,
  };

  const fmt = (iso: string, timezone: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone });

  return (
    <div className="flex flex-col overflow-hidden rounded border p-1" style={panelStyle}>
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold">{name}</span>
      </div>

      {!monthly ? (
        <div className="flex flex-1 items-center justify-center text-[8px] opacity-50">…</div>
      ) : monthly.days.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[8px] opacity-50">
          No data
        </div>
      ) : (
        <table
          className="w-full flex-1 border-collapse text-[6px] leading-tight"
          style={{ tableLayout: "fixed" }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${accent}` }}>
              <th className="px-0.5 py-px text-center font-semibold">{label("day", lang)}</th>
              <th className="px-0.5 py-px text-center font-semibold" style={{ color: accent }}>
                {label("sehri", lang)}
              </th>
              <th className="px-0.5 py-px text-center font-semibold" style={{ color: accent }}>
                {label("iftar", lang)}
              </th>
              <th className="px-0.5 py-px text-center font-semibold">{label("fajr", lang)}</th>
              <th className="px-0.5 py-px text-center font-semibold">{label("maghrib", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {monthly.days.map((day, i) => {
              const { gregDay, hijriDay } = dayLabel(day);
              const tz = monthly.location.timezone;
              return (
                <tr
                  key={day.dateISO}
                  style={{ backgroundColor: i % 2 === 1 ? theme.muted : "transparent" }}
                >
                  <td className="whitespace-nowrap px-0.5 text-center">
                    <span className="opacity-60">{weekdayName(day.dateISO, lang, "narrow")}</span>{" "}
                    {toNumerals(String(gregDay), numerals)}
                    <span className="opacity-50">/{toNumerals(String(hijriDay), numerals)}</span>
                  </td>
                  <td className="px-0.5 text-center" style={{ color: accent }}>
                    {fmt(day.fasting.sehri, tz)}
                  </td>
                  <td className="px-0.5 text-center" style={{ color: accent }}>
                    {fmt(day.fasting.iftar, tz)}
                  </td>
                  <td className="px-0.5 text-center">{fmt(day.prayers.fajr, tz)}</td>
                  <td className="px-0.5 text-center">{fmt(day.prayers.maghrib, tz)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
});

type YearGridProps = {
  months: MonthlyResponse[] | undefined;
  lang: Lang;
  numerals: Lang;
  hour12: boolean;
  theme: ThemeTokens;
  accent: string;
};

/**
 * The 4×3 grid of the 12 compact month panels. `months` is fetched by Studio
 * as 12 parallel getMonthly calls; while that's unresolved (or absent) the
 * whole grid area shows a loading message instead of guessing at data.
 */
export const YearGrid = memo(function YearGrid({
  months,
  lang,
  numerals,
  hour12,
  theme,
  accent,
}: YearGridProps) {
  if (!months) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-xl opacity-70">
        Loading the full year…
      </div>
    );
  }
  return (
    <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-2 overflow-hidden">
      {Array.from({ length: MONTH_COUNT }, (_, i) => (
        <MonthPanel
          key={i}
          monthIndex={i + 1}
          monthly={months[i]}
          lang={lang}
          numerals={numerals}
          hour12={hour12}
          theme={theme}
          accent={accent}
        />
      ))}
    </div>
  );
});
