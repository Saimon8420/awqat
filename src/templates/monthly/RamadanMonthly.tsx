import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { dayLabel, type SpecialType } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { MethodCaption } from "../MethodCaption";
import type { TemplateProps } from "../registry";
import { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "../shared";

// Short, non-localized tags for the highlighted special-day types this
// template cares about — these are proper nouns kept largely as-is across
// languages, and `i18n.ts`'s LabelKey set doesn't cover them (out of scope
// to extend here).
const HIGHLIGHT_TAG: Partial<Record<SpecialType, string>> = {
  "laylat-al-qadr": "Laylat al-Qadr",
  "white-day": "White Day",
  "eid-al-fitr": "Eid al-Fitr",
};
const HIGHLIGHT_TYPES = Object.keys(HIGHLIGHT_TAG) as SpecialType[];

/**
 * The "Ramadan" personal template (id `monthly-ramadan`). Auto-suggested by
 * the Studio when the fetched month is Ramadan-dominant. Sehri and Iftar are
 * the hero columns (largest, boldest, accent-colored); the five daily
 * prayers are secondary/smaller. Rows for white days, Laylat al-Qadr nights,
 * and Eid al-Fitr are highlighted using the theme's accent color.
 */
export function RamadanMonthly({ monthly, specialDays, state, theme }: TemplateProps) {
  const { lang, hour12, numerals, showRows, personal } = state;
  const rows = PRAYER_ROW_KEYS.filter((key) => showRows[key] !== false);
  const fmt = (iso: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone: monthly.location.timezone });
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent.
  const accent = state.accent || theme.accent;

  const ramadanDay = monthly.days.find((d) => d.hijri.monthName === "Ramadan");
  const hijriYear = ramadanDay?.hijri.year ?? monthly.days[0]?.hijri.year;

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

  // Landscape is wide but short, so split the month into two side-by-side
  // tables (~16 rows each) rather than one clipped 31-row column; portrait
  // keeps a single column. See PersonalMonthly for the shared approach.
  const landscape = state.orientation === "landscape";
  const half = Math.ceil(monthly.days.length / 2);
  const chunks = landscape
    ? [monthly.days.slice(0, half), monthly.days.slice(half)]
    : [monthly.days];
  // p-1 keeps all ~31 rows inside the fixed frame in both orientations with
  // headroom for an optional greeting/dua (rows stretch to fill when absent).
  const pad = "p-1";
  const dayHead = landscape ? "text-sm" : "text-lg";
  const heroHead = landscape ? "text-base" : "text-xl";
  const heroCell = landscape ? "text-base" : "text-lg";
  const dayCell = landscape ? "text-sm" : "text-base";

  const renderTable = (days: typeof monthly.days, offset: number) => (
    <table className="w-full flex-1 border-collapse text-left" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${accent}` }}>
          <th className={cn(pad, dayHead, "font-semibold")}>{label("day", lang)}</th>
          <th className={cn(pad, heroHead, "text-center font-bold")} style={{ color: accent }}>
            {label("sehri", lang)}
          </th>
          <th className={cn(pad, heroHead, "text-center font-bold")} style={{ color: accent }}>
            {label("iftar", lang)}
          </th>
          {rows.map((key) => (
            <th key={key} className={cn(pad, "text-center text-sm font-medium opacity-70")}>
              {label(ROW_LABEL_KEYS[key], lang)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day, j) => {
          const i = offset + j;
          const { gregDay, hijriDay } = dayLabel(day);
          const types = specialDays[day.dateISO] ?? [];
          const highlightType = HIGHLIGHT_TYPES.find((t) => types.includes(t));
          const isHighlighted = highlightType !== undefined;

          const rowStyle: CSSProperties = isHighlighted
            ? {
                backgroundColor: `${accent}26`,
                borderLeft: `4px solid ${accent}`,
              }
            : { backgroundColor: i % 2 === 1 ? theme.muted : "transparent" };

          return (
            <tr key={day.dateISO} style={rowStyle}>
              <td className={cn(pad, dayCell, "align-top font-medium")}>
                {toNumerals(String(gregDay), numerals)}
                <span className="ml-1 text-sm opacity-60">
                  /{toNumerals(String(hijriDay), numerals)}
                </span>
                {highlightType && (
                  <div className="text-xs font-semibold" style={{ color: accent }}>
                    {HIGHLIGHT_TAG[highlightType]}
                  </div>
                )}
              </td>
              <td className={cn(pad, heroCell, "text-center font-bold")} style={{ color: accent }}>
                {fmt(day.fasting.sehri)}
              </td>
              <td className={cn(pad, heroCell, "text-center font-bold")} style={{ color: accent }}>
                {fmt(day.fasting.iftar)}
              </td>
              {rows.map((key) => (
                <td key={key} className={cn(pad, "text-center text-sm opacity-80")}>
                  {fmt(day.prayers[key])}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col p-10", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <DecorLayer state={state} theme={theme} accent={accent} />
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: accent }}>
            {label("ramadan", lang)}
            {hijriYear !== undefined ? ` ${toNumerals(String(hijriYear), numerals)}` : ""}
          </h1>
          {personal?.greeting && (
            <p className="mt-1 text-xl font-medium opacity-90">{personal.greeting}</p>
          )}
        </div>
        <p className="text-xl opacity-70">{state.city}</p>
      </header>

      {monthly.days.length === 0 ? (
        <p className="flex-1 text-center text-2xl opacity-70">
          No prayer times available for this month yet.
        </p>
      ) : (
        <div className={cn("flex flex-1 gap-6", landscape ? "flex-row" : "flex-col")}>
          {chunks.map((days, ci) => (
            <div key={ci} className="flex min-w-0 flex-1 flex-col">
              {renderTable(days, ci === 0 ? 0 : half)}
            </div>
          ))}
        </div>
      )}

      {personal?.dua && (
        <p className="mt-3 text-center text-base italic opacity-80">{personal.dua}</p>
      )}

      <MethodCaption method={monthly.method} madhab={monthly.madhab} lang={lang} className="mt-3" />
    </div>
  );
}

export default RamadanMonthly;
