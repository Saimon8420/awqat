import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { dayLabel } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import type { TemplateProps } from "../registry";
import { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "../shared";

/**
 * The "Monthly Masjid Schedule" organization template (id `monthly-masjid`).
 * Same day-by-day table as PersonalMonthly, but branded with an org
 * logo/name/address/tagline header and a brand-accent banner, and slightly
 * tighter/print-friendly spacing so a whole month stays on one printable
 * page.
 */
export function OrgMonthly({ monthly, state, theme }: TemplateProps) {
  const { lang, hour12, numerals, showRows, org } = state;
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
  };

  return (
    <div dir={dir(lang)} className={cn("flex h-full w-full flex-col", LANG_FONT_CLASS[lang])} style={rootStyle}>
      <DecorLayer state={state} theme={theme} />
      <div className="h-3 w-full" style={{ backgroundColor: accent }} />

      <div className="flex flex-1 flex-col p-8">
        <header className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {org?.logo ? (
              <img
                src={org.logo}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
                style={{ backgroundColor: theme.muted }}
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
                style={{ backgroundColor: theme.muted, color: accent }}
              >
                {(org?.name ?? state.city).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold leading-tight">{org?.name ?? state.city}</h1>
              {org?.address && <p className="text-base opacity-75">{org.address}</p>}
              {org?.tagline && (
                <p className="text-base font-medium" style={{ color: accent }}>
                  {org.tagline}
                </p>
              )}
            </div>
          </div>
          <p className="text-xl font-medium opacity-70">
            {toNumerals(String(monthly.month), numerals)}/{toNumerals(String(monthly.year), numerals)}
          </p>
        </header>

        {monthly.days.length === 0 ? (
          <p className="flex-1 text-center text-2xl opacity-70">
            No prayer times available for this month yet.
          </p>
        ) : (
          <table className="w-full flex-1 border-collapse text-left" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${accent}` }}>
                <th className="p-1.5 text-base font-semibold">{label("day", lang)}</th>
                <th className="p-1.5 text-center text-base font-semibold" style={{ color: accent }}>
                  {label("sehri", lang)}
                </th>
                <th className="p-1.5 text-center text-base font-semibold" style={{ color: accent }}>
                  {label("iftar", lang)}
                </th>
                {rows.map((key) => (
                  <th key={key} className="p-1.5 text-center text-base font-semibold">
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
                    <td className="p-1.5 text-sm font-medium">
                      {toNumerals(String(gregDay), numerals)}
                      <span className="ml-1 text-xs opacity-60">
                        /{toNumerals(String(hijriDay), numerals)}
                      </span>
                    </td>
                    <td className="p-1.5 text-center text-sm font-semibold" style={{ color: accent }}>
                      {fmt(day.fasting.sehri)}
                    </td>
                    <td className="p-1.5 text-center text-sm font-semibold" style={{ color: accent }}>
                      {fmt(day.fasting.iftar)}
                    </td>
                    {rows.map((key) => (
                      <td key={key} className="p-1.5 text-center text-sm">
                        {fmt(day.prayers[key])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <p className="mt-2 text-center text-xs opacity-60">
          Method: {monthly.method} · {monthly.madhab}
        </p>
      </div>
    </div>
  );
}

export default OrgMonthly;
