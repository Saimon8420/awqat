import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { ARABIC_FONT, alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

/** A row of Andalusian multifoil arches on slim columns, like the Court of the Lions. */
export function Arcade({ theme, count = 5, height }: { theme: ThemeTokens; count?: number; height: number | string }) {
  const [light, deep, gold] = theme.sky;
  const w = 60;
  const arches = Array.from({ length: count }, (_, i) => {
    const x = i * w;
    const d = `M${x + 8} 140 V70 Q${x + 8} 52 ${x + 18} 46 Q${x + 14} 36 ${x + 24} 30 Q${x + 30} 18 ${x + 30} 12 Q${x + 30} 18 ${x + 36} 30 Q${x + 46} 36 ${x + 42} 46 Q${x + 52} 52 ${x + 52} 70 V140`;
    return (
      <g key={i}>
        <path d={`${d} Z`} fill={light} opacity={0.16} />
        <path d={d} fill="none" stroke={gold} strokeWidth={1.6} />
        <rect x={x + 55} y={40} width={5} height={100} fill={gold} opacity={0.55} />
      </g>
    );
  });
  return (
    <svg viewBox={`0 0 ${count * w} 140`} preserveAspectRatio="none" width="100%" height={height} style={{ display: "block" }}>
      <rect width={count * w} height={140} fill={deep} />
      {arches}
      <rect width={count * w} height={6} fill={gold} opacity={0.7} />
    </svg>
  );
}

export function AlhambraDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const [light, deep, gold] = theme.sky;
  const accent = d.accent;
  const k = d.k;
  const fast = (
    <FastPair
      d={d}
      style={{ paddingTop: 36 * k, marginTop: d.ramadanFirst ? 0 : 30 * k, borderTop: `6px double ${gold}` }}
      look={{ label: { fontSize: 34 * k, color: alpha(theme.fg, 0.75) }, time: { fontSize: 70 * k, fontWeight: 700, color: accent }, meridiem: true }}
    />
  );
  return (
    <DailyShell
      props={props}
      pad={[0, 76, 70]}
      art={
        <Art>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <Arcade theme={theme} height={560 * k} />
          </div>
        </Art>
      }
    >
      <div style={{ height: 300 * k }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <Mark props={props} d={d} size={96} bg={alpha(light, 0.2)} color={light} border={`3px solid ${gold}`} />
        <div style={{ fontFamily: d.displayFont, fontSize: 140 * k, lineHeight: 1, color: light, textAlign: "center", overflowWrap: "anywhere" }}>{d.title}</div>
      </div>
      {d.withArabic && <div style={{ fontFamily: ARABIC_FONT, fontSize: 70 * k, textAlign: "center", color: gold, marginTop: 10 * k }}>{d.arabicTitle}</div>}
      <div style={{ textAlign: "center", marginTop: 60 * k, fontSize: 36 * k, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: deep }}>{d.gregorian}</div>
      <div style={{ textAlign: "center", fontSize: 34 * k, color: alpha(deep, 0.75) }}>{d.hijri}</div>
      <SubLine props={props} style={{ textAlign: "center", fontSize: 30 * k, fontStyle: "italic", color: alpha(theme.fg, 0.75), marginTop: 10 * k }} />
      {d.ramadanFirst && <div style={{ marginTop: 40 * k }}>{fast}</div>}
      <div style={{ marginTop: 48 * k }}>
        <PrayerRows
          d={d}
          look={{
            size: 46,
            row: (now) => ({ padding: `${24 * k}px 10px`, borderBottom: `3px dashed ${alpha(deep, 0.3)}`, color: now ? deep : theme.fg, fontWeight: now ? 800 : 500 }),
            arabic: () => ({ color: alpha(deep, 0.75) }),
            nowMark: "◆ ",
          }}
        />
      </div>
      {!d.ramadanFirst && fast}
      <Extras props={props} d={d} color={theme.fg} accent={accent} />
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, _accent, kind) => ({
    art: <Arcade theme={theme} count={kind === "year" ? 16 : 10} height="100%" />,
    bg: theme.sky[1],
    color: theme.sky[0],
    sub: alpha(theme.sky[0], 0.85),
    style: { paddingTop: kind === "year" ? 30 : 60 },
  }),
  headFont: "var(--font-serif)",
  table: (theme, accent) => baseTable(theme, accent, { headRule: `2px dashed ${alpha(accent, 0.45)}`, stripe: () => undefined, fastColor: accent, specialBg: alpha(theme.sky[2], 0.2) }),
  year: (theme, accent) => ({ panelBg: alpha("#ffffff", 0.55), panelBorder: alpha(theme.sky[2], 0.6), headColor: accent, radius: 8 }),
};

export const AlhambraMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const AlhambraYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
