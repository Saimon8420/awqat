import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { QiblaCompass } from "@/graphics/QiblaCompass";
import type { TemplateProps } from "../registry";
import { LANG_FONT_CLASS, PRAYER_ROW_KEYS, ROW_LABEL_KEYS, pickToday } from "./shared";

/**
 * The "Daily Masjid Schedule" organization card (id `daily-org`). Same data
 * as PersonalDaily, but branded for an organization: logo + org
 * name/address/tagline up top instead of a personal greeting, and the
 * theme's accent used as a brand banner.
 */
export function OrgDaily({ monthly, qibla, state, theme }: TemplateProps) {
  const { lang, hour12, numerals, showRows, showQibla, org } = state;
  const today = pickToday(monthly, state);
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent.
  const accent = state.accent || theme.accent;

  const rootStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
    position: "relative",
  };

  if (!today) {
    return (
      <div
        dir={dir(lang)}
        className={cn(
          "flex h-full w-full items-center justify-center p-16 text-center",
          LANG_FONT_CLASS[lang],
        )}
        style={rootStyle}
      >
        <DecorLayer state={state} theme={theme} />
        <p className="text-3xl opacity-70">No prayer times available for this location yet.</p>
      </div>
    );
  }

  const fmt = (iso: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone: monthly.location.timezone });
  const hijri = `${toNumerals(String(today.hijri.day), numerals)} ${today.hijri.monthName} ${toNumerals(
    String(today.hijri.year),
    numerals,
  )} AH`;

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <DecorLayer state={state} theme={theme} />
      <div className="h-4 w-full" style={{ backgroundColor: accent }} />

      <div className="flex flex-1 flex-col justify-between p-16">
        <header className="flex flex-col items-center gap-3 text-center">
          {org?.logo ? (
            <img
              src={org.logo}
              alt=""
              className="h-28 w-28 rounded-2xl object-cover"
              style={{ backgroundColor: theme.muted }}
            />
          ) : (
            <div
              className="flex h-28 w-28 items-center justify-center rounded-2xl text-4xl font-bold"
              style={{ backgroundColor: theme.muted, color: accent }}
            >
              {(org?.name ?? state.city).slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1 className="text-6xl font-bold leading-tight">{org?.name ?? state.city}</h1>
          {org?.address && <p className="text-2xl opacity-75">{org.address}</p>}
          {org?.tagline && (
            <p className="text-2xl font-medium" style={{ color: accent }}>
              {org.tagline}
            </p>
          )}
          <p className="text-2xl font-medium opacity-80">{hijri}</p>
        </header>

        <section className="grid grid-cols-2 gap-8">
          <div
            className="flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center"
            style={{ backgroundColor: theme.muted }}
          >
            <p className="text-2xl font-medium uppercase tracking-wide opacity-80">
              {label("sehri", lang)}
            </p>
            <p className="text-6xl font-bold" style={{ color: accent }}>
              {fmt(today.fasting.sehri)}
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center"
            style={{ backgroundColor: theme.muted }}
          >
            <p className="text-2xl font-medium uppercase tracking-wide opacity-80">
              {label("iftar", lang)}
            </p>
            <p className="text-6xl font-bold" style={{ color: accent }}>
              {fmt(today.fasting.iftar)}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-6">
          {PRAYER_ROW_KEYS.filter((key) => showRows[key] !== false).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1 rounded-2xl py-6 text-center">
              <p className="text-2xl opacity-70">{label(ROW_LABEL_KEYS[key], lang)}</p>
              <p className="text-4xl font-semibold">{fmt(today.prayers[key])}</p>
            </div>
          ))}
        </section>

        {showQibla && qibla && (
          <section
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 text-center"
            style={{ borderColor: accent, borderWidth: 2, borderStyle: "solid" }}
          >
            <p className="text-xl font-medium uppercase tracking-wide opacity-80" style={{ color: accent }}>
              {label("qibla", lang)}
            </p>
            <QiblaCompass bearing={qibla.bearing} accent={accent} numerals={numerals} size={100} />
          </section>
        )}

        <p className="text-center text-xl opacity-60">
          Method: {monthly.method} · {monthly.madhab}
        </p>
      </div>
    </div>
  );
}

export default OrgDaily;
