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
  const { lang, hour12, numerals, showRows } = state;
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

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col p-10", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <DecorLayer state={state} theme={theme} accent={accent} />
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-4xl font-bold" style={{ color: accent }}>
          {label("ramadan", lang)}
          {hijriYear !== undefined ? ` ${toNumerals(String(hijriYear), numerals)}` : ""}
        </h1>
        <p className="text-xl opacity-70">{state.city}</p>
      </header>

      {monthly.days.length === 0 ? (
        <p className="flex-1 text-center text-2xl opacity-70">
          No prayer times available for this month yet.
        </p>
      ) : (
        <table className="w-full flex-1 border-collapse text-left" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accent}` }}>
              <th className="p-2 text-lg font-semibold">{label("day", lang)}</th>
              <th className="p-2 text-center text-xl font-bold" style={{ color: accent }}>
                {label("sehri", lang)}
              </th>
              <th className="p-2 text-center text-xl font-bold" style={{ color: accent }}>
                {label("iftar", lang)}
              </th>
              {rows.map((key) => (
                <th key={key} className="p-2 text-center text-sm font-medium opacity-70">
                  {label(ROW_LABEL_KEYS[key], lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthly.days.map((day, i) => {
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
                  <td className="p-2 align-top text-base font-medium">
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
                  <td className="p-2 text-center text-lg font-bold" style={{ color: accent }}>
                    {fmt(day.fasting.sehri)}
                  </td>
                  <td className="p-2 text-center text-lg font-bold" style={{ color: accent }}>
                    {fmt(day.fasting.iftar)}
                  </td>
                  {rows.map((key) => (
                    <td key={key} className="p-2 text-center text-sm opacity-80">
                      {fmt(day.prayers[key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <MethodCaption method={monthly.method} madhab={monthly.madhab} lang={lang} className="mt-3" />
    </div>
  );
}

export default RamadanMonthly;
