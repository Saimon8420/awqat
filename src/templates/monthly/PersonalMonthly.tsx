import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { dayLabel, weekdayName } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { MethodCaption } from "../MethodCaption";
import type { TemplateProps } from "../registry";
import { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "../shared";

/**
 * The "Monthly Classic" personal template (id `monthly-classic`). A full
 * month at a glance: one table row per day in `monthly.days`, with Sehri
 * and Iftar up front and the (filterable) five daily prayers after, sized
 * to stay legible across a whole month (~30 rows) on the portrait monthly
 * export canvas.
 */
export function PersonalMonthly({ monthly, state, theme }: TemplateProps) {
  const { lang, hour12, numerals, showRows, personal } = state;
  const rows = PRAYER_ROW_KEYS.filter((key) => showRows[key] !== false);
  const fmt = (iso: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone: monthly.location.timezone });
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent.
  const accent = state.accent || theme.accent;

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

  // The landscape frame is wide but short — a single ~31-row column overflows
  // it (and gets clipped in preview + export). So in landscape the month is
  // split across two side-by-side tables (~16 rows each), which fits with room
  // to spare and uses the width. Portrait keeps one full-height column.
  const landscape = state.orientation === "landscape";
  const half = Math.ceil(monthly.days.length / 2);
  const chunks = landscape
    ? [monthly.days.slice(0, half), monthly.days.slice(half)]
    : [monthly.days];
  // p-1 keeps all ~31 rows inside the fixed frame in both orientations with
  // headroom for an optional greeting/dua (rows stretch to fill when they're
  // absent). p-2 overflowed portrait, which the export would then clip.
  const pad = "p-1";
  const headSize = landscape ? "text-sm" : "text-lg";
  const cellSize = landscape ? "text-sm" : "text-base";

  const renderTable = (days: typeof monthly.days, offset: number) => (
    <table className="w-full flex-1 border-collapse text-left" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${accent}` }}>
          <th className={cn(pad, headSize, "font-semibold")}>{label("day", lang)}</th>
          <th className={cn(pad, headSize, "text-center font-semibold")} style={{ color: accent }}>
            {label("sehri", lang)}
          </th>
          <th className={cn(pad, headSize, "text-center font-semibold")} style={{ color: accent }}>
            {label("iftar", lang)}
          </th>
          {rows.map((key) => (
            <th key={key} className={cn(pad, headSize, "text-center font-semibold")}>
              {label(ROW_LABEL_KEYS[key], lang)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day, j) => {
          const i = offset + j;
          const { gregDay, hijriDay } = dayLabel(day);
          return (
            <tr
              key={day.dateISO}
              style={{ backgroundColor: i % 2 === 1 ? theme.muted : "transparent" }}
            >
              <td className={cn(pad, cellSize, "font-medium")}>
                {toNumerals(String(gregDay), numerals)}
                <span className="ml-1 text-xs opacity-60">
                  /{toNumerals(String(hijriDay), numerals)}
                </span>
                <span className="ms-1.5 text-xs font-normal opacity-55">
                  {weekdayName(day.dateISO, lang)}
                </span>
              </td>
              <td className={cn(pad, cellSize, "text-center font-semibold")} style={{ color: accent }}>
                {fmt(day.fasting.sehri)}
              </td>
              <td className={cn(pad, cellSize, "text-center font-semibold")} style={{ color: accent }}>
                {fmt(day.fasting.iftar)}
              </td>
              {rows.map((key) => (
                <td key={key} className={cn(pad, cellSize, "text-center")}>
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
        <div className="min-w-0">
          <h1 className="text-4xl font-bold">{state.city}</h1>
          {personal?.greeting && (
            <p className="mt-1 break-words text-xl font-medium" style={{ color: accent }}>
              {personal.greeting}
            </p>
          )}
        </div>
        <p className="text-xl opacity-70">
          {toNumerals(String(monthly.month), numerals)}/{toNumerals(String(monthly.year), numerals)}
        </p>
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
        <p className="mt-3 break-words text-center text-base italic opacity-80">{personal.dua}</p>
      )}

      <MethodCaption method={monthly.method} madhab={monthly.madhab} lang={lang} className="mt-3" />
    </div>
  );
}

export default PersonalMonthly;
