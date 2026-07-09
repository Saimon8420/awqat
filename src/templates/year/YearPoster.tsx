import type { CSSProperties } from "react";
import type { MonthlyResponse } from "@/lib/miqaat";
import type { Lang } from "@/lib/i18n";
import type { ThemeTokens } from "../themes";
import type { TemplateProps } from "../registry";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { dayLabel, isRamadanMonth } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { MethodCaption } from "../MethodCaption";
import { LANG_FONT_CLASS } from "../shared";

const MONTH_COUNT = 12;

/** Localized Gregorian month name for `month` (1-12), via Intl so no manual translation table is needed. */
function monthName(month: number, lang: Lang): string {
  const locale = lang === "ar" ? "ar" : lang === "bn" ? "bn" : "en";
  const date = new Date(Date.UTC(2000, month - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(date);
}

/** Min-max Hijri year(s) spanned across every fetched month's days, e.g. "1447 AH" or "1447-1448 AH". */
function hijriYearSpan(months: MonthlyResponse[]): string | null {
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
 * One compact panel of the year grid: a month name/Ramadan badge header plus
 * a dense mini-table of that month's days, limited to day + Sehri + Iftar +
 * Fajr + Maghrib (the full daily set of 8 columns doesn't fit at this
 * scale). Renders a small placeholder when `monthly` hasn't loaded yet
 * (partial `months` results) or has no days.
 */
function MonthPanel({ monthIndex, monthly, lang, numerals, hour12, theme, accent }: MonthPanelProps) {
  const name = monthName(monthIndex, lang);
  const ramadan = monthly ? isRamadanMonth(monthly.days) : false;

  const panelStyle: CSSProperties = {
    borderColor: ramadan ? accent : `${theme.fg}22`,
    borderWidth: ramadan ? 2 : 1,
    backgroundColor: ramadan ? `${accent}14` : "transparent",
  };

  const fmt = (iso: string, timezone: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone });

  return (
    <div className="flex flex-col overflow-hidden rounded border p-1" style={panelStyle}>
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold">{name}</span>
        {ramadan && (
          <span className="text-[8px] font-semibold" style={{ color: accent }}>
            {label("ramadan", lang)}
          </span>
        )}
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
              <th className="px-0.5 py-px text-left font-semibold">{label("day", lang)}</th>
              <th
                className="px-0.5 py-px text-center font-semibold"
                style={{ color: accent }}
              >
                {label("sehri", lang)}
              </th>
              <th
                className="px-0.5 py-px text-center font-semibold"
                style={{ color: accent }}
              >
                {label("iftar", lang)}
              </th>
              <th className="px-0.5 py-px text-center font-semibold">{label("fajr", lang)}</th>
              <th className="px-0.5 py-px text-center font-semibold">{label("maghrib", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {monthly.days.map((day, i) => {
              const { gregDay } = dayLabel(day);
              const tz = monthly.location.timezone;
              return (
                <tr
                  key={day.dateISO}
                  style={{ backgroundColor: i % 2 === 1 ? theme.muted : "transparent" }}
                >
                  <td className="px-0.5">{toNumerals(String(gregDay), numerals)}</td>
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
}

/**
 * The "Year Overview" personal template (id `year-overview`). A dense,
 * landscape/A3-proportioned poster: a 4x3 grid of the 12 compact month
 * panels above. `months` is fetched by Studio as 12 parallel `getMonthly`
 * calls (Jan..Dec of `state.year`) in a dedicated effect; while that's
 * unresolved (or the array is otherwise absent) the whole grid area shows a
 * loading message instead of guessing at data.
 */
export function YearPoster({ state, theme, months }: TemplateProps) {
  const { lang, hour12, numerals, city, year } = state;
  const rootStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
    position: "relative",
    // Forms a stacking context so DecorLayer's negative z-index paints above
    // this backgroundColor (but still below normal-flow content) instead of
    // behind it. See DecorLayer's own doc comment for the full explanation.
    isolation: "isolate",
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
  };
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent.
  const accent = state.accent || theme.accent;

  const hijriSpan = months && months.length > 0 ? hijriYearSpan(months) : null;
  const firstMonth = months?.[0];
  const captionMethod = firstMonth?.method ?? state.method;
  const captionMadhab = firstMonth?.madhab ?? state.madhab;

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col p-8", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <DecorLayer state={state} theme={theme} accent={accent} />
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {city} · {toNumerals(String(year), numerals)}
          </h1>
          {hijriSpan && <p className="text-sm opacity-70">{toNumerals(hijriSpan, numerals)}</p>}
        </div>
        <div className="text-right text-xs opacity-60">
          {captionMethod && captionMadhab && (
            <MethodCaption
              method={captionMethod}
              madhab={captionMadhab}
              lang={lang}
              className="text-right text-xs"
            />
          )}
          <p>
            {label("sehri", lang)} / {label("iftar", lang)} / {label("fajr", lang)} /{" "}
            {label("maghrib", lang)} · {label("ramadan", lang)} = accent border
          </p>
        </div>
      </header>

      {!months ? (
        <div className="flex flex-1 items-center justify-center text-center text-xl opacity-70">
          Loading the full year…
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default YearPoster;
