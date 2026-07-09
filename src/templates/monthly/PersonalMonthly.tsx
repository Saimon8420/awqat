import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { dayLabel } from "@/lib/calendar";
import { cn } from "@/lib/utils";
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
  const { lang, hour12, showRows } = state;
  const rows = PRAYER_ROW_KEYS.filter((key) => showRows[key] !== false);
  const fmt = (iso: string) =>
    formatTime(iso, { hour12, lang, timezone: monthly.location.timezone });

  const rootStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
  };

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col p-10", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-4xl font-bold">{state.city}</h1>
        <p className="text-xl opacity-70">
          {toNumerals(String(monthly.month), lang)}/{toNumerals(String(monthly.year), lang)}
        </p>
      </header>

      {monthly.days.length === 0 ? (
        <p className="flex-1 text-center text-2xl opacity-70">
          No prayer times available for this month yet.
        </p>
      ) : (
        <table className="w-full flex-1 border-collapse text-left" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.accent}` }}>
              <th className="p-2 text-lg font-semibold">{label("day", lang)}</th>
              <th className="p-2 text-center text-lg font-semibold" style={{ color: theme.accent }}>
                {label("sehri", lang)}
              </th>
              <th className="p-2 text-center text-lg font-semibold" style={{ color: theme.accent }}>
                {label("iftar", lang)}
              </th>
              {rows.map((key) => (
                <th key={key} className="p-2 text-center text-lg font-semibold">
                  {label(ROW_LABEL_KEYS[key], lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthly.days.map((day, i) => {
              const { gregDay, hijriDay } = dayLabel(day);
              return (
                <tr
                  key={day.dateISO}
                  style={{ backgroundColor: i % 2 === 1 ? theme.muted : "transparent" }}
                >
                  <td className="p-2 text-base font-medium">
                    {toNumerals(String(gregDay), lang)}
                    <span className="ml-1 text-sm opacity-60">
                      /{toNumerals(String(hijriDay), lang)}
                    </span>
                  </td>
                  <td className="p-2 text-center text-base font-semibold" style={{ color: theme.accent }}>
                    {fmt(day.fasting.sehri)}
                  </td>
                  <td className="p-2 text-center text-base font-semibold" style={{ color: theme.accent }}>
                    {fmt(day.fasting.iftar)}
                  </td>
                  {rows.map((key) => (
                    <td key={key} className="p-2 text-center text-base">
                      {fmt(day.prayers[key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="mt-3 text-center text-sm opacity-60">
        Method: {monthly.method} · {monthly.madhab}
      </p>
    </div>
  );
}

export default PersonalMonthly;
