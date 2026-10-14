import { FitColumn } from "../FitColumn";
import { fitText } from "@/lib/card-text";
import type { CSSProperties } from "react";
import { dir, label, toNumerals } from "@/lib/i18n";
import { DecorLayer } from "@/graphics/DecorLayer";
import { QiblaTape } from "@/graphics/QiblaTape";
import type { TemplateProps } from "../registry";
import { YearGrid, hijriYearSpan, monthName } from "../year/yearGrid";
import {
  ARABIC_FONT,
  OrgMark,
  alpha,
  bodyFont,
  displayFont,
  gregorianText,
  hijriText,
  isRamadanDay,
  methodText,
  prayerNames,
  ratioScale,
  useDailyData,
} from "./common";
import { MonthTable } from "./MonthTable";
import { hijriMonthSpan, NoData } from "./shared-bits";

/** Night-sky field with a faint gold star lattice — shared by all three Mihrab formats. */
function MihrabField({ sky, accent }: { sky: [string, string, string]; accent: string }) {
  const tile = `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 56 56'><g fill='none' stroke='${accent}' stroke-width='1'><path d='M28 4 L34 22 L52 28 L34 34 L28 52 L22 34 L4 28 L22 22 Z'/><circle cx='28' cy='28' r='6'/></g></svg>`;
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -2,
          background: `radial-gradient(120% 70% at 50% 0%, ${sky[0]} 0%, ${sky[1]} 45%, ${sky[2]} 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -2,
          opacity: 0.09,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
          backgroundSize: "112px 112px",
        }}
      />
    </>
  );
}

function rootStyle(props: TemplateProps): CSSProperties {
  const { theme, state } = props;
  return {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    color: theme.fg,
    background: theme.sky[2],
    fontFamily: bodyFont(state.lang),
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
  };
}

/* ------------------------------------------------------------------ */
/* Daily                                                               */
/* ------------------------------------------------------------------ */

export function MihrabDaily(props: TemplateProps) {
  const { monthly, qibla, state, theme } = props;
  const { lang, numerals, showQibla, personal, org, masjid, ramadan } = state;
  const accent = state.accent || theme.accent;
  const { today, fmt, rows, current, next } = useDailyData(monthly, state);
  const k = ratioScale(state);
  const serif = displayFont(lang);

  if (!today) return <NoData style={rootStyle(props)} />;

  const inRamadan = isRamadanDay(today);
  const showFast = ramadan || state.showFasting;
  const title = masjid && org?.name ? org.name : state.city;
  const topLine =
    ramadan && inRamadan
      ? `${label("ramadan", lang)} ${toNumerals(String(today.hijri.day), numerals)} · ${toNumerals(String(today.hijri.year), numerals)}`
      : hijriText(today, numerals);
  const subLine = masjid
    ? [org?.address, org?.name ? state.city : null].filter(Boolean).join(" · ") || label("prayerTimes", "ar")
    : label("prayerTimes", "ar");
  const twoCol = !state.showArabic || lang === "ar";
  const hasPersonal = !masjid && (personal?.greeting || personal?.dua);

  return (
    <div dir={dir(lang)} style={rootStyle(props)}>
      <MihrabField sky={theme.sky} accent={accent} />
      <DecorLayer state={state} theme={theme} accent={accent} />

      {/* The mihrab arch frame */}
      <svg
        aria-hidden="true"
        viewBox="0 0 472 892"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 68, top: 68 * k, width: 944, height: `calc(100% - ${136 * k}px)`, zIndex: -1 }}
      >
        <g fill="none" stroke={accent}>
          <path d="M8 884 V250 C8 120 120 40 236 8 C352 40 464 120 464 250 V884 Z" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path
            d="M22 870 V256 C22 134 128 58 236 24 C344 58 450 134 450 256 V870 Z"
            strokeWidth="1"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      {/* Crescent at the crown of the arch */}
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        style={{ position: "absolute", left: "50%", top: 150 * k, width: 46 * k, height: 46 * k, transform: "translateX(-50%)" }}
      >
        <path d="M24 8a13 13 0 1 0 0 24 10 10 0 1 1 0-24Z" fill={accent} />
      </svg>

      <FitColumn
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: (masjid ? 196 : 250) * k,
          bottom: 112 * k,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {masjid && (
          <div style={{ marginBottom: 14 * k }}>
            <OrgMark
              logo={org?.logo}
              name={title}
              size={92 * k}
              bg={alpha(accent, 0.14)}
              color={accent}
              border={`2px solid ${alpha(accent, 0.6)}`}
            />
          </div>
        )}
        <div style={{ fontSize: 30 * k, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent }}>
          {topLine}
        </div>
        <div style={{ fontSize: 30 * k, color: alpha(theme.fg, 0.75), marginTop: 10 * k }}>
          {gregorianText(today.dateISO, lang, numerals)}
        </div>
        <div
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: (title.length > 18 ? 76 : title.length > 10 ? 96 : 128) * k,
            lineHeight: 1.05,
            marginTop: 40 * k,
            maxWidth: "100%",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: masjid && org?.address ? undefined : ARABIC_FONT,
            fontSize: (masjid && org?.address ? 30 : 58) * k,
            color: accent,
            marginTop: 10 * k,
          }}
        >
          {subLine}
        </div>

        {state.showNext && next && (
          <div
            style={{
              marginTop: 36 * k,
              display: "inline-flex",
              gap: 14,
              alignItems: "center",
              border: `2px solid ${alpha(accent, 0.45)}`,
              borderRadius: 999,
              padding: `${14 * k}px ${32 * k}px`,
              fontSize: 30 * k,
            }}
          >
            {label("next", lang)} · <b style={{ color: accent }}>{label(next.key, lang)}</b> {next.inText}
          </div>
        )}

        {hasPersonal && personal?.greeting && (
          <div style={{ fontFamily: serif, fontStyle: "italic",  color: accent, marginTop: 26 * k, ...fitText(personal.greeting, 40 * k, 2) }}>
            {personal.greeting}
          </div>
        )}

        {showFast && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              marginTop: 52 * k,
              borderTop: `2px solid ${alpha(accent, 0.35)}`,
              borderBottom: `2px solid ${alpha(accent, 0.35)}`,
              background: ramadan ? alpha(accent, 0.08) : undefined,
            }}
          >
            {(["sehri", "iftar"] as const).map((key, i) => {
              const t = fmt(today.fasting[key]);
              return (
                <div
                  key={key}
                  style={{
                    padding: `${30 * k}px 0`,
                    borderInlineStart: i === 1 ? `2px solid ${alpha(accent, 0.35)}` : undefined,
                  }}
                >
                  <div style={{ fontSize: 24 * k, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: accent }}>
                    {label(key === "sehri" ? "sehriEnds" : "iftar", lang)}
                  </div>
                  <div style={{ fontFamily: serif, fontWeight: 600, fontSize: (ramadan ? 96 : 80) * k, lineHeight: 1.15, marginTop: 6 * k }}>
                    {t.clock}
                    {t.meridiem && <span style={{ fontSize: "0.5em", marginInlineStart: 8 }}>{t.meridiem.toLowerCase()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ width: "100%", marginTop: 40 * k, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
          {rows.map((key) => {
            const { name, arabic } = prayerNames(key, lang);
            const t = fmt(today.prayers[key]);
            const isNow = key === current;
            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr auto 1fr",
                  alignItems: "center",
                  padding: `${(masjid ? 12 : 18) * k}px 14px`,
                  fontSize: 38 * k,
                  borderBottom: isNow ? "2px dashed transparent" : `2px dashed ${alpha(theme.fg, 0.14)}`,
                  background: isNow
                    ? `linear-gradient(90deg, transparent, ${alpha(accent, 0.18)}, transparent)`
                    : undefined,
                }}
              >
                <span style={{ textAlign: "start" }}>{name}</span>
                {!twoCol && (
                  <span style={{ fontFamily: ARABIC_FONT, fontSize: 44 * k, color: theme.muted }}>{arabic}</span>
                )}
                <span style={{ textAlign: "end", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isNow ? accent : undefined }}>
                  {t.clock}
                  {t.meridiem && <span style={{ fontSize: "0.6em", marginInlineStart: 6, opacity: 0.8 }}>{t.meridiem}</span>}
                </span>
              </div>
            );
          })}
        </div>

        {showQibla && qibla && (
        <div style={{ marginTop: 22 * k, alignSelf: "stretch", width: "100%" }}>
          <QiblaTape bearing={qibla.bearing} distanceKm={qibla.distanceKm} accent={accent} ink={theme.fg} lang={lang} numerals={numerals} width="100%" k={k} />
        </div>
      )}

        {hasPersonal && personal?.dua && (
          <div style={{ fontFamily: serif, fontStyle: "italic",  opacity: 0.85, marginTop: 18 * k, maxWidth: "100%", overflowWrap: "anywhere", ...fitText(personal.dua, 30 * k, 3) }}>
            {personal.dua}
          </div>
        )}
        {masjid && org?.tagline && (
          <div style={{ color: accent, marginTop: 14 * k, ...fitText(org.tagline, 26 * k, 2) }}>{org.tagline}</div>
        )}

        <div style={{ marginTop: 18 * k, fontSize: 22 * k, color: alpha(theme.fg, 0.55), letterSpacing: "0.06em" }} dir="ltr">
          {methodText(monthly)}
        </div>
      </FitColumn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly                                                             */
/* ------------------------------------------------------------------ */

export function MihrabMonthly(props: TemplateProps) {
  const { monthly, specialDays, state, theme } = props;
  const { lang, numerals, masjid, org, ramadan, personal } = state;
  const accent = state.accent || theme.accent;
  const serif = displayFont(lang);
  const landscape = state.orientation === "landscape";
  const ramadanDay = monthly.days.find((d) => d.hijri.monthName === "Ramadan");

  const heading =
    ramadan && ramadanDay
      ? `${label("ramadan", lang)} ${toNumerals(String(ramadanDay.hijri.year), numerals)}`
      : `${monthName(monthly.month, lang)} ${toNumerals(String(monthly.year), numerals)}`;
  const place = masjid && org?.name ? org.name : state.city;

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column", padding: landscape ? "44px 56px" : "56px 62px" }}>
      <MihrabField sky={[theme.sky[1], theme.sky[1], theme.sky[2]]} accent={accent} />
      <DecorLayer state={state} theme={theme} accent={accent} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 22, border: `1.5px solid ${alpha(accent, 0.45)}`, borderRadius: "inherit", zIndex: -1 }} />

      <header style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
        {masjid && <OrgMark logo={org?.logo} name={place} size={84} bg={alpha(accent, 0.14)} color={accent} border={`2px solid ${alpha(accent, 0.6)}`} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 56, lineHeight: 1.05 }}>
            {heading} · {place}
          </div>
          <div style={{ color: accent, letterSpacing: "0.18em", fontSize: 18, textTransform: "uppercase", marginTop: 8 }}>
            {hijriMonthSpan(monthly, numerals)}
            {masjid && org?.address ? ` · ${org.address}` : ""}
          </div>
          {!masjid && personal?.greeting && (
            <div style={{ fontFamily: serif, fontStyle: "italic",  color: accent, marginTop: 6, ...fitText(personal.greeting, 26, 2) }}>{personal.greeting}</div>
          )}
        </div>
      </header>

      <MonthTable
        monthly={monthly}
        specialDays={specialDays}
        state={state}
        size={landscape ? 17 : 19}
        look={{
          font: bodyFont(lang),
          color: theme.fg,
          headColor: accent,
          headRule: `1.5px solid ${alpha(accent, 0.5)}`,
          fridayStyle: { background: alpha(accent, 0.07) },
          todayStyle: { background: alpha(accent, 0.24), color: "#ffffff", fontWeight: 700 },
          hijriColor: alpha(theme.fg, 0.55),
          fastColor: accent,
          specialBg: alpha(accent, 0.14),
        }}
      />

      <footer style={{ marginTop: 14, textAlign: "center" }}>
        {!masjid && personal?.dua && (
          <div style={{ fontFamily: serif, fontStyle: "italic",  opacity: 0.85, marginBottom: 6, ...fitText(personal.dua, 22, 2) }}>{personal.dua}</div>
        )}
        {masjid && org?.tagline && <div style={{ color: accent, marginBottom: 6, ...fitText(org.tagline, 20, 2) }}>{org.tagline}</div>}
        <div dir="ltr" style={{ fontSize: 16, color: alpha(theme.fg, 0.55), letterSpacing: "0.06em" }}>
          {methodText(monthly)}
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Year                                                                */
/* ------------------------------------------------------------------ */

export function MihrabYear(props: TemplateProps) {
  const { state, theme, months } = props;
  const { lang, numerals, hour12, masjid, org, personal } = state;
  const accent = state.accent || theme.accent;
  const serif = displayFont(lang);
  const span = months && months.length > 0 ? hijriYearSpan(months) : null;
  const place = masjid && org?.name ? org.name : state.city;
  const first = months?.[0];

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column", padding: "40px 48px 30px" }}>
      <MihrabField sky={[theme.sky[1], theme.sky[1], theme.sky[2]]} accent={accent} />
      <DecorLayer state={state} theme={theme} accent={accent} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 18, border: `1.5px solid ${alpha(accent, 0.45)}`, borderRadius: "inherit", zIndex: -1 }} />

      <header style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        {masjid && <OrgMark logo={org?.logo} name={place} size={64} bg={alpha(accent, 0.14)} color={accent} border={`2px solid ${alpha(accent, 0.6)}`} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 44, lineHeight: 1.05 }}>
            {place} · {toNumerals(String(state.year), numerals)}
          </div>
          <div style={{ color: accent, letterSpacing: "0.18em",  textTransform: "uppercase", marginTop: 6, fontSize: 14, overflowWrap: "anywhere" }}>
            {span ? toNumerals(span, numerals) : label("prayerTimetable", lang)}
            {masjid && org?.address ? ` · ${org.address}` : ""}
            {!masjid && personal?.greeting ? ` · ${personal.greeting}` : ""}
          </div>
        </div>
        <div dir="ltr" style={{ textAlign: "right", fontSize: 13, color: alpha(theme.fg, 0.6) }}>
          {first && <div>{methodText(first)}</div>}
          <div style={{ color: accent }}>
            {label("sehri", lang)} · {label("iftar", lang)} · {label("fajr", lang)} · {label("maghrib", lang)}
          </div>
        </div>
      </header>

      <YearGrid
        months={months}
        lang={lang}
        numerals={numerals}
        hour12={hour12}
        theme={{ ...theme, muted: alpha(accent, 0.06) }}
        accent={accent}
        look={{
          panelBg: alpha("#ffffff", 0.03),
          panelBorder: alpha(accent, 0.3),
          headColor: accent,
          headFont: serif,
          radius: 6,
        }}
      />

      {!masjid && personal?.dua && (
        <div style={{ marginTop: 8, textAlign: "center", fontFamily: serif, fontStyle: "italic",  opacity: 0.85, ...fitText(personal.dua, 16, 2) }}>{personal.dua}</div>
      )}
    </div>
  );
}
