import type { CSSProperties } from "react";
import { dir, label, toNumerals } from "@/lib/i18n";
import { DecorLayer } from "@/graphics/DecorLayer";
import { QiblaCompass } from "@/graphics/QiblaCompass";
import type { TemplateProps } from "../registry";
import { YearGrid, hijriYearSpan, monthName } from "../year/yearGrid";
import {
  ARABIC_FONT,
  AYAH_ARABIC,
  AYAH_TRANSLATION,
  OrgMark,
  PRAYER_ROW_KEYS,
  alpha,
  bodyFont,
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

const WARM_BG = "#fff6e6";
const WARM_LABEL = "#8a5a14";
const WARM_TIME = "#5a3a08";

function skyCss(sky: [string, string, string]): string {
  return `radial-gradient(70% 90% at 80% 0%, #ffd9a0 0%, rgba(255,217,160,0) 60%), linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 100%)`;
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
    fontFamily: bodyFont(state.lang),
    ...(typeof state.radius === "number" ? { borderRadius: state.radius } : null),
  };
}

/* ------------------------------------------------------------------ */
/* Daily                                                               */
/* ------------------------------------------------------------------ */

export function DaylightDaily(props: TemplateProps) {
  const { monthly, qibla, state, theme } = props;
  const { lang, numerals, showQibla, personal, org, masjid, ramadan } = state;
  const accent = state.accent || theme.accent;
  const { today, fmt, rows, current, next, nextKey } = useDailyData(monthly, state);
  const k = ratioScale(state);

  if (!today) return <NoData style={rootStyle(props)} />;

  const inRamadan = isRamadanDay(today);
  const showFast = ramadan || state.showFasting;
  const title = masjid && org?.name ? org.name : state.city;
  const heroKey = state.showNext && nextKey ? nextKey : "fajr";
  const heroIso = (() => {
    // After Isha the next prayer is tomorrow's Fajr.
    if (state.showNext && next && current === "isha" && heroKey === "fajr") {
      const i = monthly.days.findIndex((d) => d.dateISO === today.dateISO);
      return monthly.days[i + 1]?.prayers.fajr ?? today.prayers.fajr;
    }
    return today.prayers[heroKey];
  })();
  const hero = fmt(heroIso);
  const heroLabel =
    ramadan && inRamadan
      ? `${label("ramadan", lang)} ${toNumerals(String(today.hijri.day), numerals)} · ${label(heroKey, lang)}`
      : state.showNext && next
        ? `${label("nextPrayer", lang)} · ${label(heroKey, lang)}`
        : label(heroKey, lang);
  const hasPersonal = !masjid && (personal?.greeting || personal?.dua);
  const withArabic = state.showArabic && lang !== "ar";

  // Timeline: Fajr → Isha mapped onto the bar.
  const t0 = new Date(today.prayers.fajr).getTime();
  const t1 = new Date(today.prayers.isha).getTime();
  const pos = (iso: string) => ((new Date(iso).getTime() - t0) / Math.max(1, t1 - t0)) * 100;

  const fastBlock = showFast ? (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 * k }}>
      {(["sehri", "iftar"] as const).map((key) => {
        const t = fmt(today.fasting[key]);
        return (
          <div key={key} style={{ borderRadius: 32, padding: `${26 * k}px 28px`, background: WARM_BG }}>
            <div style={{ fontSize: 26 * k, color: WARM_LABEL }}>{label(key === "sehri" ? "sehriEnds" : "iftar", lang)}</div>
            <div style={{ fontWeight: 700, fontSize: (ramadan ? 70 : 60) * k, color: WARM_TIME, fontVariantNumeric: "tabular-nums" }}>
              {t.clock}
              {t.meridiem && <span style={{ fontSize: "0.5em", marginInlineStart: 6 }}>{t.meridiem.toLowerCase()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div dir={dir(lang)} style={rootStyle(props)}>
      <div aria-hidden="true" style={{ position: "absolute", inset: "0 0 auto", height: 940 * k, zIndex: -2, background: skyCss(theme.sky) }} />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInlineEnd: 140,
          top: 132 * k,
          width: 168 * k,
          height: 168 * k,
          borderRadius: "50%",
          zIndex: -2,
          background: "radial-gradient(circle, #fff3d6 0 40%, #ffd28a 41% 100%)",
          boxShadow: "0 0 120px 40px rgba(255,210,138,.5)",
        }}
      />
      <DecorLayer state={state} theme={theme} accent={accent} />

      <div style={{ position: "absolute", top: 112 * k, left: 96, right: 96, bottom: 84 * k, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, maxWidth: `calc(100% - ${230 * k}px)` }}>
          {masjid && <OrgMark logo={org?.logo} name={title} size={84 * k} bg="rgba(255,255,255,.18)" color="#ffffff" radius="22px" border="2px solid rgba(255,255,255,.5)" />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 44 * k, fontWeight: 700, color: "#f2fff9", overflowWrap: "anywhere" }}>{title}</div>
            <div style={{ fontSize: 30 * k, color: "rgba(255,255,255,.82)", marginTop: 6 }}>
              {gregorianText(today.dateISO, lang, numerals, "short")} · {hijriText(today, numerals)}
              {masjid && org?.address ? ` · ${org.address}` : ""}
            </div>
          </div>
        </div>
        {hasPersonal && personal?.greeting && (
          <div style={{ fontSize: 32 * k, fontStyle: "italic", color: "#ffffff", marginTop: 18 * k }}>{personal.greeting}</div>
        )}

        <div style={{ marginTop: 92 * k, fontSize: 26 * k, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
          {heroLabel}
        </div>
        <div style={{ fontSize: 224 * k, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", color: "#ffffff", marginTop: 12 * k, fontVariantNumeric: "tabular-nums" }}>
          {hero.clock}
          {hero.meridiem && <span style={{ fontSize: 68 * k, letterSpacing: 0, marginInlineStart: 12, color: "rgba(255,255,255,.88)" }}>{hero.meridiem.toLowerCase()}</span>}
        </div>
        {state.showNext && next && <div style={{ fontSize: 34 * k, color: "rgba(255,255,255,.9)", marginTop: 16 * k }}>{next.inText}</div>}

        <div style={{ marginTop: 70 * k, background: "#ffffff", borderRadius: 56, padding: `${44 * k}px 48px ${36 * k}px`, boxShadow: `0 40px 80px -48px ${alpha(accent, 0.8)}` }}>
          <div
            style={{
              position: "relative",
              height: 16,
              borderRadius: 99,
              background: "linear-gradient(90deg,#1b2b4a,#f6b25e 25%,#ffe7a8 45%,#f6b25e 70%,#1b2b4a)",
            }}
          >
            {PRAYER_ROW_KEYS.map((key) => (
              <i
                key={key}
                style={{
                  position: "absolute",
                  top: -10,
                  left: `${pos(today.prayers[key])}%`,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: key === current ? accent : "#ffffff",
                  border: `6px solid ${accent}`,
                  transform: "translateX(-50%)",
                }}
              />
            ))}
          </div>

          {ramadan && fastBlock}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 44 * k }}>
            {rows.map((key) => {
              const { name, arabic } = prayerNames(key, lang);
              const t = fmt(today.prayers[key]);
              const isNow = key === current;
              return (
                <div key={key} style={{ borderRadius: 32, padding: `${22 * k}px 28px`, background: isNow ? accent : theme.muted }}>
                  <div style={{ fontSize: 26 * k, color: isNow ? "rgba(255,255,255,.8)" : alpha(theme.fg, 0.65), display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{name}</span>
                    {withArabic && <span style={{ fontFamily: ARABIC_FONT }}>{arabic}</span>}
                  </div>
                  <div style={{ fontSize: 48 * k, fontWeight: 700, color: isNow ? "#ffffff" : theme.fg, fontVariantNumeric: "tabular-nums" }}>
                    {t.clock}
                    {t.meridiem && <span style={{ fontSize: "0.5em", marginInlineStart: 4, opacity: 0.8 }}>{t.meridiem}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {!ramadan && fastBlock}

          {showQibla && qibla && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 * k, color: accent }}>
              <QiblaCompass bearing={qibla.bearing} accent={accent} numerals={numerals} size={80 * k} />
              <span style={{ fontSize: 24 * k, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" }}>{label("qibla", lang)}</span>
            </div>
          )}
        </div>

        {hasPersonal && personal?.dua ? (
          <div style={{ marginTop: 44 * k, textAlign: "center", fontSize: 30 * k, fontStyle: "italic", color: alpha(theme.fg, 0.8), overflowWrap: "anywhere" }}>
            {personal.dua}
          </div>
        ) : k === 1 ? (
          <div style={{ marginTop: 52, textAlign: "center", color: alpha(theme.fg, 0.85) }}>
            <div style={{ fontFamily: ARABIC_FONT, fontSize: 52, lineHeight: 1.6, color: accent }}>{AYAH_ARABIC}</div>
            <div style={{ fontSize: 28, fontStyle: "italic", marginTop: 6 }}>{AYAH_TRANSLATION[lang].text}</div>
            <div style={{ fontSize: 24, marginTop: 4, opacity: 0.75 }}>{AYAH_TRANSLATION[lang].ref}</div>
          </div>
        ) : null}
        {masjid && org?.tagline && <div style={{ marginTop: 20 * k, textAlign: "center", fontSize: 28 * k, color: accent }}>{org.tagline}</div>}

        <div dir="ltr" style={{ marginTop: "auto", textAlign: "center", fontSize: 22 * k, color: alpha(theme.fg, 0.5) }}>
          {methodText(monthly)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly                                                             */
/* ------------------------------------------------------------------ */

function Band({ theme, children, style }: { theme: TemplateProps["theme"]; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "relative",
        background: `linear-gradient(120deg, ${theme.sky[0]}, ${theme.sky[1]})`,
        color: "#ffffff",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInlineEnd: 48,
          top: -60,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff3d6 0 40%, #ffd28a 41% 100%)",
          opacity: 0.85,
          boxShadow: "0 0 60px 20px rgba(255,210,138,.4)",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export function DaylightMonthly(props: TemplateProps) {
  const { monthly, specialDays, state, theme } = props;
  const { lang, numerals, masjid, org, ramadan, personal } = state;
  const accent = state.accent || theme.accent;
  const landscape = state.orientation === "landscape";
  const ramadanDay = monthly.days.find((d) => d.hijri.monthName === "Ramadan");
  const place = masjid && org?.name ? org.name : state.city;
  const heading =
    ramadan && ramadanDay
      ? `${label("ramadan", lang)} ${toNumerals(String(ramadanDay.hijri.year), numerals)}`
      : `${monthName(monthly.month, lang)} ${toNumerals(String(monthly.year), numerals)}`;

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column" }}>
      <DecorLayer state={state} theme={theme} accent={accent} />
      <Band theme={theme} style={{ padding: landscape ? "34px 56px 26px" : "48px 62px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {masjid && <OrgMark logo={org?.logo} name={place} size={72} bg="rgba(255,255,255,.18)" color="#fff" radius="18px" border="2px solid rgba(255,255,255,.5)" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{heading}</div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,.85)", marginTop: 6 }}>
              {place} · {hijriMonthSpan(monthly, numerals)}
              {masjid && org?.address ? ` · ${org.address}` : ""}
              {!masjid && personal?.greeting ? ` · ${personal.greeting}` : ""}
            </div>
          </div>
        </div>
      </Band>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: landscape ? "18px 40px 22px" : "22px 46px 28px" }}>
        <MonthTable
          monthly={monthly}
          specialDays={specialDays}
          state={state}
          size={landscape ? 17 : 19}
          look={{
            font: bodyFont(lang),
            color: theme.fg,
            headColor: alpha(theme.fg, 0.6),
            headStyle: { letterSpacing: "0.04em", textTransform: "none", fontWeight: 600 },
            headRule: "none",
            stripe: (i) => (i % 2 === 0 ? theme.muted : undefined),
            todayStyle: { background: accent, color: "#ffffff", fontWeight: 700 },
            hijriColor: alpha(theme.fg, 0.55),
            fastColor: accent,
            specialBg: WARM_BG,
            pillRows: true,
          }}
        />
        {(!masjid && personal?.dua) || (masjid && org?.tagline) ? (
          <div style={{ marginTop: 10, textAlign: "center", fontSize: 20, fontStyle: "italic", color: alpha(theme.fg, 0.75) }}>
            {masjid ? org?.tagline : personal?.dua}
          </div>
        ) : null}
        <div dir="ltr" style={{ marginTop: 8, textAlign: "center", fontSize: 15, color: alpha(theme.fg, 0.5) }}>
          {methodText(monthly)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Year                                                                */
/* ------------------------------------------------------------------ */

export function DaylightYear(props: TemplateProps) {
  const { state, theme, months } = props;
  const { lang, numerals, hour12, masjid, org, personal } = state;
  const accent = state.accent || theme.accent;
  const span = months && months.length > 0 ? hijriYearSpan(months) : null;
  const place = masjid && org?.name ? org.name : state.city;
  const first = months?.[0];

  return (
    <div dir={dir(lang)} style={{ ...rootStyle(props), display: "flex", flexDirection: "column" }}>
      <DecorLayer state={state} theme={theme} accent={accent} />
      <Band theme={theme} style={{ padding: "28px 44px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {masjid && <OrgMark logo={org?.logo} name={place} size={56} bg="rgba(255,255,255,.18)" color="#fff" radius="14px" border="2px solid rgba(255,255,255,.5)" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              {place} · {toNumerals(String(state.year), numerals)}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", marginTop: 4 }}>
              {span ? toNumerals(span, numerals) : label("prayerTimetable", lang)}
              {masjid && org?.address ? ` · ${org.address}` : ""}
              {!masjid && personal?.greeting ? ` · ${personal.greeting}` : ""}
            </div>
          </div>
          <div dir="ltr" style={{ fontSize: 13, textAlign: "right", color: "rgba(255,255,255,.9)", marginInlineEnd: 190 }}>
            {first && <div>{methodText(first)}</div>}
            <div>
              {label("sehri", lang)} · {label("iftar", lang)} · {label("fajr", lang)} · {label("maghrib", lang)}
            </div>
          </div>
        </div>
      </Band>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "16px 30px 18px" }}>
        <YearGrid
          months={months}
          lang={lang}
          numerals={numerals}
          hour12={hour12}
          theme={theme}
          accent={accent}
          look={{ panelBg: "#ffffff", panelBorder: alpha(theme.fg, 0.1), headColor: accent, radius: 10 }}
        />
        {!masjid && personal?.dua && (
          <div style={{ marginTop: 8, textAlign: "center", fontStyle: "italic", fontSize: 15, color: alpha(theme.fg, 0.75) }}>{personal.dua}</div>
        )}
      </div>
    </div>
  );
}
