import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { dir, label, toNumerals, type LabelKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../registry";
import { LANG_FONT_CLASS, PRAYER_ROW_KEYS, pickToday } from "./shared";

const ROW_LABEL_KEYS: Record<(typeof PRAYER_ROW_KEYS)[number], LabelKey> = {
  fajr: "fajr",
  sunrise: "sunrise",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

/**
 * The "Daily Classic" personal card (id `daily-classic`). A hero-sized
 * (fills PreviewStage's `#export-node` canvas) prayer-time card: Hijri date
 * + city, Sehri/Iftar front and center, the 5 prayers + Sunrise in a grid,
 * an optional Qibla flourish, and an optional personal greeting/dua footer.
 */
export function PersonalDaily({ monthly, qibla, state, theme }: TemplateProps) {
  const { lang, hour12, showRows, showQibla, personal } = state;
  const today = pickToday(monthly);

  const rootStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
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
        <p className="text-3xl opacity-70">No prayer times available for this location yet.</p>
      </div>
    );
  }

  const fmt = (iso: string) => formatTime(iso, { hour12, lang, timezone: monthly.location.timezone });
  const hijri = `${toNumerals(String(today.hijri.day), lang)} ${today.hijri.monthName} ${toNumerals(
    String(today.hijri.year),
    lang,
  )} AH`;

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col justify-between p-16", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <header className="flex flex-col gap-3">
        <p className="text-3xl font-medium opacity-80">{hijri}</p>
        <h1 className="text-7xl font-bold leading-tight">{state.city}</h1>
      </header>

      <section className="grid grid-cols-2 gap-8">
        <div
          className="flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center"
          style={{ backgroundColor: theme.muted }}
        >
          <p className="text-2xl font-medium uppercase tracking-wide opacity-80">
            {label("sehri", lang)}
          </p>
          <p className="text-6xl font-bold" style={{ color: theme.accent }}>
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
          <p className="text-6xl font-bold" style={{ color: theme.accent }}>
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
          className="flex items-center justify-center gap-3 rounded-2xl py-4 text-center"
          style={{ borderColor: theme.accent, borderWidth: 2, borderStyle: "solid" }}
        >
          <p className="text-2xl font-medium" style={{ color: theme.accent }}>
            {label("qibla", lang)}: {toNumerals(String(Math.round(qibla.bearing)), lang)}°
          </p>
        </section>
      )}

      {(personal?.greeting || personal?.dua) && (
        <footer className="flex flex-col items-center gap-2 text-center">
          {personal?.greeting && <p className="text-3xl font-medium">{personal.greeting}</p>}
          {personal?.dua && <p className="text-2xl italic opacity-80">{personal.dua}</p>}
        </footer>
      )}

      <p className="text-center text-xl opacity-60">
        Method: {monthly.method} · {monthly.madhab}
      </p>
    </div>
  );
}

export default PersonalDaily;
