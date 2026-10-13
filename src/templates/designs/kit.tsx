import type { CSSProperties, ReactNode } from "react";
import { dir, label, toNumerals } from "@/lib/i18n";
import { DecorLayer } from "@/graphics/DecorLayer";
import { QiblaTape } from "@/graphics/QiblaTape";
import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { YearGrid, hijriYearSpan, monthName, type YearLook } from "../year/yearGrid";
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
  type PrayerRowKey,
} from "./common";
import { MonthTable, type TableLook } from "./MonthTable";
import { hijriMonthSpan, NoData } from "./shared-bits";

/**
 * Shared building blocks for the illustrated designs (Alhambra, Lantern Night,
 * Modern Minimal, Desert Dusk, Sixty Dome, Kiswa Gold, Crescent Skyline).
 * Each design draws its own art and layout; the data, the prayer rows, the
 * Sehri/Iftar pair, the Masjid/personal extras and the monthly/year pages
 * come from here so every design behaves the same way.
 */

export function rootStyle(props: TemplateProps, extra?: CSSProperties): CSSProperties {
  const { theme, state } = props;
  return {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    color: theme.fg,
    background: theme.bg,
    fontFamily: bodyFont(state.lang),
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
    ...extra,
  };
}

/** Everything a daily card needs, worked out once. */
export function useDaily(props: TemplateProps) {
  const { monthly, state, theme } = props;
  const data = useDailyData(monthly, state);
  const { lang, masjid, org, ramadan } = state;
  const today = data.today;
  return {
    ...data,
    // A little tighter when the Qibla strip needs room at the foot.
    k: ratioScale(state) * (state.showQibla && props.qibla ? 0.94 : 1),
    lang,
    numerals: state.numerals,
    accent: state.accent || theme.accent,
    title: masjid && org?.name ? org.name : state.city,
    gregorian: today ? gregorianText(today.dateISO, lang, state.numerals) : "",
    gregorianShort: today ? gregorianText(today.dateISO, lang, state.numerals, "short") : "",
    hijri: today ? hijriText(today, state.numerals) : "",
    /** Ramadan mode puts Sehri / Iftar first and larger. */
    ramadanFirst: ramadan,
    inRamadan: isRamadanDay(today ?? undefined),
    showFast: ramadan || state.showFasting,
    withArabic: state.showArabic && lang !== "ar",
    displayFont: displayFont(lang),
    arabicTitle: label("prayerTimes", "ar"),
  };
}
export type Daily = ReturnType<typeof useDaily>;

/** The fixed card frame: backdrop art, the user's own decor, then the content column. */
export function DailyShell({
  props,
  art,
  children,
  pad,
}: {
  props: TemplateProps;
  art?: ReactNode;
  children: ReactNode;
  /** Content inset [top, side, bottom] in card pixels, before ratio scaling. */
  pad: [number, number, number];
}) {
  const { state, theme } = props;
  const k = ratioScale(state);
  return (
    <div dir={dir(state.lang)} data-script={state.lang} style={rootStyle(props)}>
      {art}
      <DecorLayer state={state} theme={theme} accent={state.accent || theme.accent} />
      <div style={{ position: "absolute", top: pad[0] * k, left: pad[1], right: pad[1], bottom: pad[2] * k, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/** Absolute, behind-content art layer. */
export function Art({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -2, pointerEvents: "none", ...style }}>
      {children}
    </div>
  );
}

export function NoDay({ props }: { props: TemplateProps }) {
  return <NoData style={rootStyle(props)} />;
}

export type RowLook = {
  size: number;
  gap?: number;
  /** Style for one row; `now` is the current prayer. */
  row: (now: boolean, i: number) => CSSProperties;
  arabic?: (now: boolean) => CSSProperties;
  time?: (now: boolean) => CSSProperties;
  /** Text before the name of the current prayer (e.g. "✦ "). */
  nowMark?: string;
};

/** The prayer list: name · Arabic name · time. */
export function PrayerRows({ d, look }: { d: Daily; look: RowLook }) {
  const { today, rows, current, fmt, lang, withArabic, k } = d;
  if (!today) return null;
  const fs = look.size * k;
  return (
    <div style={{ display: "grid", gap: (look.gap ?? 0) * k, fontSize: fs }}>
      {rows.map((key: PrayerRowKey, i: number) => {
        const { name, arabic } = prayerNames(key, lang);
        const t = fmt(today.prayers[key]);
        const now = key === current;
        return (
          <div key={key} style={{ display: "grid", gridTemplateColumns: withArabic ? "1fr auto 1fr" : "1fr auto", alignItems: "center", ...look.row(now, i) }}>
            <span>
              {now && look.nowMark}
              {name}
            </span>
            {withArabic && <span style={{ fontFamily: ARABIC_FONT, ...look.arabic?.(now) }}>{arabic}</span>}
            <span style={{ textAlign: "end", fontWeight: 700, fontVariantNumeric: "tabular-nums", ...look.time?.(now) }}>
              {t.clock}
              {t.meridiem && <small style={{ fontSize: "0.55em", marginInlineStart: "0.2em" }}>{t.meridiem}</small>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type FastLook = {
  label: CSSProperties;
  time: CSSProperties;
  box?: CSSProperties;
  gap?: number;
  /** Write "am"/"pm" after the time. */
  meridiem?: boolean;
};

/** Sehri ends / Iftar side by side. */
export function FastPair({ d, look, style }: { d: Daily; look: FastLook; style?: CSSProperties }) {
  const { today, fmt, lang, k, ramadanFirst } = d;
  if (!today || !d.showFast) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: (look.gap ?? 0) * k, textAlign: "center", ...style }}>
      {(["sehri", "iftar"] as const).map((key) => {
        const t = fmt(today.fasting[key]);
        return (
          <div key={key} style={look.box}>
            <div style={look.label}>{label(key === "sehri" ? "sehriEnds" : "iftar", lang)}</div>
            <div style={{ fontVariantNumeric: "tabular-nums", ...look.time, ...(ramadanFirst ? { fontSize: Number(look.time.fontSize ?? 0) * 1.15 } : null) }}>
              {t.clock}
              {look.meridiem && t.meridiem && <span style={{ fontSize: "0.5em", marginInlineStart: 6 }}>{t.meridiem.toLowerCase()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Masjid logo, shown beside the title in Masjid mode. */
export function Mark({ props, d, size, color, bg, border }: { props: TemplateProps; d: Daily; size: number; color: string; bg: string; border?: string }) {
  const { masjid, org } = props.state;
  if (!masjid) return null;
  return <OrgMark logo={org?.logo} name={d.title} size={size * d.k} bg={bg} color={color} radius="22%" border={border} />;
}

/** Greeting / dua / masjid address & tagline / qibla / method caption, in one coloured block. */
export function Extras({ props, d, color, accent, align = "center" }: { props: TemplateProps; d: Daily; color: string; accent: string; align?: "center" | "start" }) {
  const { state, monthly, qibla } = props;
  const { masjid, org, personal, showQibla } = state;
  const k = d.k;
  return (
    <div style={{ marginTop: "auto", paddingTop: 20 * k, textAlign: align, color }}>
      {!masjid && personal?.dua && <div style={{ fontStyle: "italic", fontSize: 30 * k, marginBottom: 14 * k, overflowWrap: "anywhere" }}>{personal.dua}</div>}
      {masjid && org?.tagline && <div style={{ fontSize: 28 * k, color: accent, marginBottom: 12 * k }}>{org.tagline}</div>}
      {showQibla && qibla && (
        <div style={{ marginTop: 0 * k, marginBottom: 12 * k }}>
          <QiblaTape bearing={qibla.bearing} distanceKm={qibla.distanceKm} accent={accent} ink={color} lang={d.lang} numerals={d.numerals} width="100%" k={k} />
        </div>
      )}
      <div dir="ltr" style={{ fontSize: 21 * k, opacity: 0.55 }}>
        {methodText(monthly)}
      </div>
    </div>
  );
}

/** Masjid address or personal greeting, under the title. */
export function SubLine({ props, style }: { props: TemplateProps; style?: CSSProperties }) {
  const { masjid, org, personal } = props.state;
  const text = masjid ? org?.address : personal?.greeting;
  return text ? <div style={{ overflowWrap: "anywhere", ...style }}>{text}</div> : null;
}

/* ------------------------------------------------------------------ */
/* Monthly and Year pages                                              */
/* ------------------------------------------------------------------ */

export type PageSpec = {
  /** The header band: its art (behind) and colours. */
  band: (theme: ThemeTokens, accent: string, kind: "monthly" | "year") => { art: ReactNode; bg: string; color: string; sub: string; style?: CSSProperties };
  /** Heading face for the band. */
  headFont?: string;
  table: (theme: ThemeTokens, accent: string) => TableLook;
  year: (theme: ThemeTokens, accent: string) => YearLook;
  /** Page body background (defaults to theme.bg). */
  bodyBg?: (theme: ThemeTokens) => string;
};

function Band({ props, spec, kind, heading }: { props: TemplateProps; spec: PageSpec; kind: "monthly" | "year"; heading: string }) {
  const { state, theme, monthly, months } = props;
  const { masjid, org, personal, numerals, lang } = state;
  const accent = state.accent || theme.accent;
  const b = spec.band(theme, accent, kind);
  const place = masjid && org?.name ? org.name : state.city;
  const landscape = state.orientation === "landscape";
  const year = kind === "year";
  const span = year ? (months && months.length ? toNumerals(hijriYearSpan(months) ?? "", numerals) : label("prayerTimetable", lang)) : hijriMonthSpan(monthly, numerals);
  const extra = [masjid ? org?.address : undefined, !masjid ? personal?.greeting : undefined].filter(Boolean).join(" · ");
  return (
    <div style={{ position: "relative", isolation: "isolate", overflow: "hidden", background: b.bg, color: b.color, padding: year ? "26px 44px 22px" : landscape ? "34px 56px 26px" : "48px 62px 38px", flex: "none", ...b.style }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        {b.art}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {masjid && <OrgMark logo={org?.logo} name={place} size={year ? 56 : 72} bg="rgba(255,255,255,.18)" color={b.color} radius="18px" border={`2px solid ${alpha(accent, 0.6)}`} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: spec.headFont ?? displayFont(lang), fontSize: year ? 40 : 56, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.01em" }}>
            {year ? `${place} · ${toNumerals(String(state.year), numerals)}` : heading}
          </div>
          <div style={{ fontSize: year ? 15 : 20, color: b.sub, marginTop: 6 }}>
            {year ? span : `${place} · ${span}`}
            {extra ? ` · ${extra}` : ""}
            {year && months?.[0] ? <span dir="ltr"> · {methodText(months[0])}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function KitMonthly({ props, spec }: { props: TemplateProps; spec: PageSpec }) {
  const { monthly, specialDays, state, theme } = props;
  const { lang, numerals, masjid, org, ramadan, personal } = state;
  const accent = state.accent || theme.accent;
  const landscape = state.orientation === "landscape";
  const ramadanDay = monthly.days.find((d) => d.hijri.monthName === "Ramadan");
  const heading =
    ramadan && ramadanDay
      ? `${label("ramadan", lang)} ${toNumerals(String(ramadanDay.hijri.year), numerals)}`
      : `${monthName(monthly.month, lang)} ${toNumerals(String(monthly.year), numerals)}`;
  const note = masjid ? org?.tagline : personal?.dua;
  return (
    <div dir={dir(lang)} data-script={lang} style={rootStyle(props, { display: "flex", flexDirection: "column", background: spec.bodyBg?.(theme) ?? theme.bg })}>
      <DecorLayer state={state} theme={theme} accent={accent} />
      <Band props={props} spec={spec} kind="monthly" heading={heading} />
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: landscape ? "18px 40px 22px" : "22px 46px 28px" }}>
        <MonthTable monthly={monthly} specialDays={specialDays} state={state} size={landscape ? 17 : 19} look={spec.table(theme, accent)} />
        {note && <div style={{ marginTop: 10, textAlign: "center", fontSize: 20, fontStyle: "italic", color: alpha(theme.fg, 0.75) }}>{note}</div>}
        <div dir="ltr" style={{ marginTop: 8, textAlign: "center", fontSize: 15, color: alpha(theme.fg, 0.5) }}>
          {methodText(monthly)}
        </div>
      </div>
    </div>
  );
}

export function KitYear({ props, spec }: { props: TemplateProps; spec: PageSpec }) {
  const { state, theme, months } = props;
  const { lang, numerals, hour12, masjid, personal } = state;
  const accent = state.accent || theme.accent;
  return (
    <div dir={dir(lang)} data-script={lang} style={rootStyle(props, { display: "flex", flexDirection: "column", background: spec.bodyBg?.(theme) ?? theme.bg })}>
      <DecorLayer state={state} theme={theme} accent={accent} />
      <Band props={props} spec={spec} kind="year" heading="" />
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "16px 30px 18px" }}>
        <YearGrid months={months} lang={lang} numerals={numerals} hour12={hour12} theme={theme} accent={accent} look={spec.year(theme, accent)} />
        {!masjid && personal?.dua && <div style={{ marginTop: 8, textAlign: "center", fontStyle: "italic", fontSize: 15, color: alpha(theme.fg, 0.75) }}>{personal.dua}</div>}
      </div>
    </div>
  );
}

/** A light table look most designs start from. */
export function baseTable(theme: ThemeTokens, accent: string, over?: Partial<TableLook>): TableLook {
  return {
    font: "inherit",
    color: theme.fg,
    headColor: alpha(theme.fg, 0.6),
    headRule: `2px solid ${alpha(accent, 0.5)}`,
    stripe: (i) => (i % 2 === 0 ? theme.muted : undefined),
    todayStyle: { background: accent, color: "#ffffff", fontWeight: 700 },
    hijriColor: alpha(theme.fg, 0.55),
    fastColor: accent,
    specialBg: alpha(accent, 0.14),
    ...over,
  };
}
