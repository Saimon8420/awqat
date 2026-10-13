import type { ReactNode } from "react";
import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { ARABIC_FONT, alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

function colours(theme: ThemeTokens) {
  const [brick, dark, sky] = theme.art ?? [theme.accent, theme.sky[2], theme.sky[0]];
  return { brick, dark, sky, paper: theme.bg };
}

/** Bagerhat's Sixty Dome Mosque: rows of small domes over a long brick front with arched doors and corner towers. */
export function SixtyDomes({ theme, height, span = 300 }: { theme: ThemeTokens; height: number | string; span?: number }) {
  const { brick, dark, sky, paper } = colours(theme);
  const parts: ReactNode[] = [];
  const cols = Math.round(span / 28);
  for (let r = 0; r < 3; r++) {
    const y = 52 + r * 10;
    const op = [0.5, 0.75, 1][r];
    for (let i = 0; i < cols; i++) {
      const x = 10 + i * 28 + (r % 2 ? 14 : 0);
      parts.push(
        <g key={`${r}-${i}`} opacity={op} fill={brick}>
          <path d={`M${x - 10} ${y} Q${x - 10} ${y - 14} ${x} ${y - 15} Q${x + 10} ${y - 14} ${x + 10} ${y}Z`} />
          <rect x={x - 0.6} y={y - 19} width={1.2} height={4} />
        </g>,
      );
    }
  }
  const doors = Math.round(span / 33);
  return (
    <svg viewBox={`0 0 ${span} 120`} preserveAspectRatio="xMidYMax slice" width="100%" height={height} style={{ display: "block" }}>
      <rect width={span} height={120} fill={sky} />
      {parts}
      <rect y={78} width={span} height={42} fill={brick} />
      {Array.from({ length: doors }, (_, i) => {
        const x = 20 + i * 33;
        return <path key={i} d={`M${x} 120 V96 Q${x} 86 ${x + 8} 84 Q${x + 16} 86 ${x + 16} 96 V120Z`} fill={dark} />;
      })}
      <rect y={80} width={span} height={2} fill={paper} opacity={0.5} />
      <rect y={84} width={span} height={1} fill={paper} opacity={0.35} />
      {[4, span - 18].map((x) => (
        <g key={x} fill={dark}>
          <rect x={x} y={54} width={14} height={66} />
          <path d={`M${x - 1} 56 Q${x + 7} 40 ${x + 15} 56Z`} />
        </g>
      ))}
    </svg>
  );
}

/** Faint brick coursing across the paper. */
function brickTexture(brick: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24'><path d='M0 .5H48M0 12.5H48M.5 0V12M24.5 12V24' stroke='${brick}' stroke-opacity='.16' stroke-width='1.4'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function SixtyDomeDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const { brick, dark, paper } = colours(theme);
  const acc = d.accent;
  const k = d.k;
  const fast = (
    <FastPair
      d={d}
      style={{ marginTop: d.ramadanFirst ? 30 * k : 40 * k }}
      look={{ label: { fontSize: 30 * k, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800, color: acc }, time: { fontSize: 76 * k, fontWeight: 700, color: theme.fg }, meridiem: true }}
    />
  );
  return (
    <DailyShell
      props={props}
      pad={[440, 86, 72]}
      art={
        <Art style={{ backgroundImage: brickTexture(brick), backgroundSize: "48px 24px" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <SixtyDomes theme={theme} height={410 * k} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 32 * d.k, background: `repeating-linear-gradient(90deg, ${brick} 0 6%, ${dark} 6% 8%)` }} />
        </Art>
      }
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Mark props={props} d={d} size={92} bg={paper} color={brick} border={`3px solid ${brick}`} />
        <div style={{ fontFamily: d.displayFont, fontSize: 130 * k, lineHeight: 1, color: acc, textAlign: "center", overflowWrap: "anywhere" }}>{d.title}</div>
      </div>
      {d.withArabic && <div style={{ fontFamily: ARABIC_FONT, fontSize: 60 * k, textAlign: "center", color: alpha(dark, 0.85) }}>{d.arabicTitle}</div>}
      <div style={{ textAlign: "center", fontSize: 34 * k, fontWeight: 700, letterSpacing: "0.04em", color: dark, marginTop: 14 * k }}>
        {d.gregorian} · {d.hijri}
      </div>
      <SubLine props={props} style={{ textAlign: "center", fontSize: 30 * k, fontStyle: "italic", color: alpha(theme.fg, 0.75), marginTop: 6 * k }} />
      {d.ramadanFirst && fast}
      <div style={{ marginTop: 34 * k }}>
        <PrayerRows
          d={d}
          look={{
            size: 45,
            gap: 10,
            row: (now) => ({
              padding: `${18 * k}px 38px`,
              borderRadius: 13,
              background: now ? acc : alpha("#ffffff", 0.55),
              border: `3px solid ${now ? acc : alpha(acc, 0.35)}`,
              color: now ? paper : undefined,
            }),
            arabic: (now) => ({ color: now ? paper : acc }),
          }}
        />
      </div>
      {!d.ramadanFirst && fast}
      <Extras props={props} d={d} color={theme.fg} accent={acc} />
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, _accent, kind) => {
    const { paper } = colours(theme);
    return {
      art: (
        <div style={{ position: "absolute", inset: 0 }}>
          <SixtyDomes theme={theme} height="100%" span={kind === "year" ? 900 : 600} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${alpha(paper, 0.94)} 0%, ${alpha(paper, 0.82)} 45%, ${alpha(paper, 0)} 75%)` }} />
        </div>
      ),
      bg: paper,
      color: theme.accent,
      sub: alpha(theme.fg, 0.75),
      style: { paddingBottom: kind === "year" ? 34 : 56 },
    };
  },
  headFont: "var(--font-serif)",
  table: (theme, accent) => baseTable(theme, accent, { headRule: `3px solid ${alpha(accent, 0.6)}` }),
  year: (_theme, accent) => ({ panelBg: alpha("#ffffff", 0.6), panelBorder: alpha(accent, 0.35), headColor: accent, radius: 6 }),
};

export const SixtyDomeMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const SixtyDomeYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
