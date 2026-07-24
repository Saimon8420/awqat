import type { CSSProperties } from "react";
import type { TemplateProps } from "../registry";
import { dir, label, toNumerals } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { MethodCaption } from "../MethodCaption";
import { LANG_FONT_CLASS } from "../shared";
import { YearGrid, hijriYearSpan } from "./yearGrid";

/**
 * The "Year Masjid Schedule" organization template (id `year-org`). Same
 * shared 12-month grid as the personal Year Overview, but branded with an org
 * logo/name/address/tagline header and a brand-accent banner (mirroring
 * OrgMonthly), with the year and method meta on the right. Uses org fields
 * rather than the personal greeting/dua.
 */
export function OrgYearPoster({ state, theme, months }: TemplateProps) {
  const { lang, hour12, numerals, city, year, org } = state;
  const rootStyle: CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.fg,
    position: "relative",
    // Forms a stacking context so DecorLayer's negative z-index paints above
    // this backgroundColor (but still below normal-flow content).
    isolation: "isolate",
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
  };
  // The user's custom accent wins when set; otherwise the theme's accent.
  const accent = state.accent || theme.accent;

  const hijriSpan = months && months.length > 0 ? hijriYearSpan(months) : null;
  const firstMonth = months?.[0];
  const captionMethod = firstMonth?.method ?? state.method;
  const captionMadhab = firstMonth?.madhab ?? state.madhab;

  return (
    <div
      dir={dir(lang)}
      className={cn("flex h-full w-full flex-col", LANG_FONT_CLASS[lang])}
      style={rootStyle}
    >
      <DecorLayer state={state} theme={theme} accent={accent} />
      <div className="h-3 w-full" style={{ backgroundColor: accent }} />

      <div className="flex flex-1 flex-col p-8">
        <header className="mb-4 flex items-start justify-between gap-4">
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
                {(org?.name ?? city).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold leading-tight">{org?.name ?? city}</h1>
              {org?.address && <p className="text-base opacity-75">{org.address}</p>}
              {org?.tagline && (
                <p className="text-base font-medium" style={{ color: accent }}>
                  {org.tagline}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold leading-none">{toNumerals(String(year), numerals)}</p>
            {hijriSpan && <p className="mt-1 text-sm opacity-70">{toNumerals(hijriSpan, numerals)}</p>}
            {captionMethod && captionMadhab && (
              <MethodCaption
                method={captionMethod}
                madhab={captionMadhab}
                lang={lang}
                className="mt-1 text-right text-xs opacity-60"
              />
            )}
            <p className="text-xs opacity-60">
              {label("sehri", lang)} / {label("iftar", lang)} / {label("fajr", lang)} /{" "}
              {label("maghrib", lang)}
            </p>
          </div>
        </header>

        <YearGrid
          months={months}
          lang={lang}
          numerals={numerals}
          hour12={hour12}
          theme={theme}
          accent={accent}
        />
      </div>
    </div>
  );
}

export default OrgYearPoster;
