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
  displayFont,
  gregorianText,
  isRamadanDay,
  methodText,
  prayerNames,
  ratioScale,
  useDailyData,
} from "./common";
import { MonthTable } from "./MonthTable";
import { hijriMonthSpan, NoData } from "./shared-bits";

const SANS = "var(--font-latin)";

/** Warm paper with a soft centre glow and a fine laid-paper grain. */
function Paper({ sky }: { sky: [string, string, string] }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: -2,
        background: `radial-gradient(90% 60% at 50% 40%, ${sky[0]}, ${sky[1]} 70%, ${sky[2]} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, rgba(120,90,50,.025) 0 2px, transparent 2px 5px)",
        }}
      />
    </div>
  );
}

/** The double ink rule framing every Parchment page. */
function InkFrame({ ink, inset }: { ink: string; inset: number }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset, border: `3px solid ${ink}`, zIndex: -1 }}>
      <div style={{ position: "absolute", inset: 12, border: `1.5px solid ${ink}` }} />
    </div>
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
    background: theme.bg,
    fontFamily: displayFont(state.lang),
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
  };
}

/* ------------------------------------------------------------------ */
/* Daily                                                               */
/* ------------------------------------------------------------------ */

export function ParchmentDaily(props: TemplateProps) {
  const { monthly, qibla, state, theme } = props;
  const { lang, numerals, showQibla, personal, org, masjid, ramadan } = state;
  const accent = state.accent || theme.accent;
  const ink = theme.fg;
  const { today, fmt, rows, current, next } = useDailyData(monthly, state);
  const k = ratioScale(state);

  if (!today) return <NoData style={rootStyle(props)} />;

  const inRamadan = isRamadanDay(today);
  const showFast = ramadan || state.showFasting;
  const title = masjid && org?.name ? org.name : state.city;
  const hasPersonal = !masjid && (personal?.greeting || personal?.dua);
  const withArabic = state.showArabic && lang !== "ar";

  const ribbon = showFast ? (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: accent, color: theme.sky[0], marginTop: 28 * k }}>
      {(["sehri", "iftar"] as const).map((key, i) => {
        const t = fmt(today.fasting[key]);
        return (
          <div
            key={key}
            style={{
              padding: `${34 * k}px 44px`,
              textAlign: i === 1 ? "end" : "start",
              borderInlineStart: i === 1 ? `1.5px solid ${alpha(theme.sky[0], 0.35)}` : undefined,
            }}
          >
            <div style={{ fontFamily: SANS, fontSize: 24 * k, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85 }}>
              {label(key === "sehri" ? "sehriEnds" : "iftar", lang)}
            </div>
            <div style={{ fontWeight: 600, fontSize: (ramadan ? 84 : 72) * k, lineHeight: 1.1 }}>
              {t.clock}
              {t.meridiem && <span style={{ fontSize: "0.45em", marginInlineStart: 8 }}>{t.meridiem.toLowerCase()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div dir={dir(lang)} style={rootStyle(props)}>
      <Paper sky={theme.sky} />
      <DecorLayer state={state} theme={theme} accent={accent} />
      <InkFrame ink={ink} inset={52} />

      <div style={{ position: "absolute", left: 128, right: 128, top: 128 * k, bottom: 108 * k, display: "flex", flexDirection: "column" }}>
        {masjid ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <OrgMark logo={org?.logo} name={title} size={96 * k} bg={alpha(accent, 0.1)} color={accent} radius="14px" border={`2px solid ${ink}`} />
          </div>
        ) : (
          <div style={{ fontFamily: ARABIC_FONT, fontSize: 52 * k, textAlign: "center", color: accent }}>بِسْمِ ٱللَّٰهِ</div>
        )}
        <div style={{ fontFamily: ARABIC_FONT, fontWeight: 700, fontSize: 184 * k, lineHeight: 1.05, textAlign: "center", marginTop: 16 * k }}>
          {ramadan && inRamadan ? "رمضان" : "أوقات"}
        </div>
        <div style={{ textAlign: "center", fontStyle: "italic", fontSize: 36 * k, color: alpha(ink, 0.75), overflowWrap: "anywhere" }}>
          {label("prayerTimes", lang)} · {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 24 * k,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginTop: 52 * k,
            padding: `${18 * k}px 0`,
            borderTop: `3px solid ${ink}`,
            borderBottom: `1.5px solid ${ink}`,
          }}
        >
          <span>{gregorianText(today.dateISO, lang, numerals, "short")}</span>
          <span>
            {toNumerals(String(today.hijri.day), numerals)} {today.hijri.monthName} {toNumerals(String(today.hijri.year), numerals)}
          </span>
        </div>

        {(state.showNext && next) || (hasPersonal && personal?.greeting) || (masjid && org?.address) ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, fontStyle: "italic", fontSize: 30 * k, color: accent, marginTop: 14 * k }}>
            <span>{masjid ? org?.address : personal?.greeting}</span>
            {state.showNext && next && (
              <span>
                {label("next", lang)}: {label(next.key, lang)} {next.inText}
              </span>
            )}
          </div>
        ) : null}

        {ramadan && ribbon}

        <div style={{ marginTop: 22 * k, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
          {rows.map((key) => {
            const { name, arabic } = prayerNames(key, lang);
            const t = fmt(today.prayers[key]);
            const isNow = key === current;
            return (
              <div key={key} style={{ display: "flex", alignItems: "baseline", gap: 18, padding: `${16 * k}px 0`, fontSize: 48 * k, color: isNow ? accent : undefined }}>
                <span>{name}</span>
                <span style={{ flex: 1, borderBottom: `3px dotted ${isNow ? accent : alpha(ink, 0.4)}`, transform: "translateY(-10px)" }} />
                {withArabic && (
                  <span style={{ fontFamily: ARABIC_FONT, fontSize: 44 * k, color: isNow ? accent : theme.muted, minWidth: 148, textAlign: "end" }}>{arabic}</span>
                )}
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums oldstyle-nums" }}>
                  {t.clock}
                  {t.meridiem && <span style={{ fontSize: "0.55em", marginInlineStart: 6 }}>{t.meridiem.toLowerCase()}</span>}
                </span>
              </div>
            );
          })}
        </div>

        {showQibla && qibla && (
        <div style={{ marginTop: 18 * k }}>
          <QiblaTape bearing={qibla.bearing} distanceKm={qibla.distanceKm} accent={accent} ink={ink} lang={lang} numerals={numerals} width="100%" k={k} />
        </div>
      )}

        {hasPersonal && personal?.dua && (
          <div style={{ textAlign: "center", fontStyle: "italic", fontSize: 30 * k, color: alpha(ink, 0.8), marginTop: 14 * k, overflowWrap: "anywhere" }}>
            {personal.dua}
          </div>
        )}

        {!ramadan && ribbon}
        {masjid && org?.tagline && (
          <div style={{ textAlign: "center", fontStyle: "italic", fontSize: 26 * k, color: accent, marginTop: 14 * k }}>{org.tagline}</div>
        )}
        <div dir="ltr" style={{ textAlign: "center", fontFamily: SANS, fontSize: 22 * k, color: theme.muted, marginTop: 20 * k, letterSpacing: "0.06em" }}>
          {methodText(monthly)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly                                                             */
/* ------------------------------------------------------------------ */

export function ParchmentMonthly(props: TemplateProps) {
  const { monthly, specialDays, state, theme } = props;
  const { lang, numerals, masjid, org, ramadan, personal } = state;
  const accent = state.accent || theme.accent;
  const ink = theme.fg;
  const landscape = state.orientation === "landscape";
  const ramadanDay = monthly.days.find((d) => d.hijri.monthName === "Ramadan");
  const place = masjid && org?.name ? org.name : state.city;
  const heading =
    ramadan && ramadanDay
      ? `${label("ramadan", lang)} ${toNumerals(String(ramadanDay.hijri.year), numerals)}`
      : `${monthName(monthly.month, lang)} ${toNumerals(String(monthly.year), numerals)}`;

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column", padding: landscape ? "56px 72px 44px" : "70px 74px 52px" }}>
      <Paper sky={theme.sky} />
      <DecorLayer state={state} theme={theme} accent={accent} />
      <InkFrame ink={ink} inset={26} />

      <header style={{ textAlign: "center", marginBottom: 18 }}>
        {masjid && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <OrgMark logo={org?.logo} name={place} size={72} bg={alpha(accent, 0.1)} color={accent} radius="12px" border={`2px solid ${ink}`} />
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 62, lineHeight: 1 }}>{heading}</div>
        <div style={{ fontStyle: "italic", fontSize: 24, color: alpha(ink, 0.75), marginTop: 8 }}>
          {label("prayerTimetable", lang)} · {place} · {hijriMonthSpan(monthly, numerals)}
        </div>
        {(masjid ? org?.address : personal?.greeting) && (
          <div style={{ fontStyle: "italic", fontSize: 22, color: accent, marginTop: 4 }}>{masjid ? org?.address : personal?.greeting}</div>
        )}
      </header>

      <MonthTable
        monthly={monthly}
        specialDays={specialDays}
        state={state}
        size={landscape ? 18 : 20}
        look={{
          font: displayFont(lang),
          color: ink,
          headColor: ink,
          headStyle: { fontFamily: SANS },
          headRule: `1.5px solid ${ink}`,
          frameTop: `3px solid ${ink}`,
          frameBottom: `3px solid ${ink}`,
          fridayStyle: { fontStyle: "italic", color: theme.muted },
          todayStyle: { color: accent, fontWeight: 700, background: alpha(accent, 0.08) },
          hijriColor: theme.muted,
          fastColor: accent,
          specialBg: alpha(accent, 0.1),
        }}
      />

      <footer style={{ marginTop: 12, textAlign: "center" }}>
        {!masjid && personal?.dua && <div style={{ fontStyle: "italic", fontSize: 22, color: alpha(ink, 0.8), marginBottom: 4 }}>{personal.dua}</div>}
        {masjid && org?.tagline && <div style={{ fontStyle: "italic", fontSize: 20, color: accent, marginBottom: 4 }}>{org.tagline}</div>}
        <div dir="ltr" style={{ fontFamily: SANS, fontSize: 16, color: theme.muted, letterSpacing: "0.06em" }}>
          {methodText(monthly)}
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Year                                                                */
/* ------------------------------------------------------------------ */

export function ParchmentYear(props: TemplateProps) {
  const { state, theme, months } = props;
  const { lang, numerals, hour12, masjid, org, personal } = state;
  const accent = state.accent || theme.accent;
  const ink = theme.fg;
  const span = months && months.length > 0 ? hijriYearSpan(months) : null;
  const place = masjid && org?.name ? org.name : state.city;
  const first = months?.[0];

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column", padding: "48px 56px 34px" }}>
      <Paper sky={theme.sky} />
      <DecorLayer state={state} theme={theme} accent={accent} />
      <InkFrame ink={ink} inset={20} />

      <header style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "end", gap: 20, paddingBottom: 12, marginBottom: 14, borderBottom: `3px solid ${ink}` }}>
        <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: alpha(ink, 0.75) }}>
          {masjid && org?.address ? org.address : label("prayerTimetable", lang)}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 46, lineHeight: 1 }}>
            {place} · {toNumerals(String(state.year), numerals)}
          </div>
          <div style={{ fontStyle: "italic", fontSize: 18, color: accent, marginTop: 4 }}>
            {span ? toNumerals(span, numerals) : ""}
            {!masjid && personal?.greeting ? ` · ${personal.greeting}` : ""}
          </div>
        </div>
        <div dir="ltr" style={{ textAlign: "right", fontFamily: SANS, fontSize: 12, color: alpha(ink, 0.7) }}>
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
        theme={{ ...theme, muted: alpha(ink, 0.05) }}
        accent={accent}
        look={{ panelBorder: alpha(ink, 0.35), headColor: accent, headFont: displayFont(lang), bodyFont: displayFont(lang) }}
      />

      {!masjid && personal?.dua && (
        <div style={{ marginTop: 8, textAlign: "center", fontStyle: "italic", fontSize: 16, color: alpha(ink, 0.8) }}>{personal.dua}</div>
      )}
    </div>
  );
}
