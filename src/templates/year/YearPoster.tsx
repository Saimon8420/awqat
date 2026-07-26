import type { CSSProperties } from "react";
import type { TemplateProps } from "../registry";
import { dir, label, toNumerals } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DecorLayer } from "@/graphics/DecorLayer";
import { MethodCaption } from "../MethodCaption";
import { LANG_FONT_CLASS } from "../shared";
import { YearGrid, hijriYearSpan } from "./yearGrid";

/**
 * The "Year Overview" personal template (id `year-overview`). A dense,
 * landscape/A3-proportioned poster: a personal header (city · year, optional
 * greeting) above the shared 12-month grid (see yearGrid), with an optional
 * dua below.
 */
export function YearPoster({ state, theme, months }: TemplateProps) {
  const { lang, hour12, numerals, city, year, personal } = state;
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
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">
            {city} · {toNumerals(String(year), numerals)}
          </h1>
          {hijriSpan && <p className="text-sm opacity-70">{toNumerals(hijriSpan, numerals)}</p>}
          {personal?.greeting && (
            <p className="mt-0.5 break-words text-base font-medium" style={{ color: accent }}>
              {personal.greeting}
            </p>
          )}
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

      {personal?.dua && (
        <p className="mt-2 break-words text-center text-sm italic opacity-80">{personal.dua}</p>
      )}
    </div>
  );
}

export default YearPoster;
