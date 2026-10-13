import { label } from "@/lib/i18n";
import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

/** One fanous lantern hanging on its chain. */
function Lamp({ x, len, scale, warm }: { x: number; len: number; scale: number; warm: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <line x1={0} y1={0} x2={0} y2={len} stroke={warm} strokeWidth={0.8} opacity={0.7} />
      <g transform={`translate(0 ${len}) scale(${scale})`}>
        <circle r={22} cy={20} fill={warm} opacity={0.14} />
        <path d="M-7 0 H7 L10 8 L6 30 H-6 L-10 8 Z" fill="#2a1408" stroke={warm} strokeWidth={1.4} />
        <path d="M-4 8 H4 L3 26 H-3 Z" fill={warm} opacity={0.92} />
        <path d="M-6 30 H6 L0 38 Z" fill={warm} />
        <circle cx={0} cy={-2} r={2.5} fill={warm} />
      </g>
    </g>
  );
}

export function Lanterns({ warm, height, wide = false }: { warm: string; height: number | string; wide?: boolean }) {
  const set = wide
    ? [40, 110, 190, 270, 350, 430, 510, 590, 670, 750].map((x, i) => ({ x, len: [30, 60, 40, 70, 35, 55, 30, 65, 45, 35][i], scale: 0.9 }))
    : [
        { x: 40, len: 40, scale: 1 },
        { x: 95, len: 75, scale: 1.25 },
        { x: 150, len: 30, scale: 1.5 },
        { x: 205, len: 70, scale: 1.2 },
        { x: 260, len: 45, scale: 1 },
      ];
  return (
    <svg viewBox={wide ? "0 0 800 120" : "0 0 300 150"} preserveAspectRatio="xMidYMin meet" width="100%" height={height} style={{ display: "block" }}>
      {set.map((l) => (
        <Lamp key={l.x} {...l} warm={warm} />
      ))}
    </svg>
  );
}

const glow = (theme: ThemeTokens) => `radial-gradient(120% 70% at 50% 18%, ${theme.sky[0]} 0%, ${theme.sky[1]} 55%, ${theme.sky[2]} 100%)`;

export function LanternDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const warm = d.accent;
  const deep = theme.sky[2];
  const k = d.k;
  const fast = (
    <FastPair
      d={d}
      style={{ marginTop: d.ramadanFirst ? 34 * k : 40 * k }}
      look={{ label: { fontSize: 30 * k, letterSpacing: "0.14em", textTransform: "uppercase", color: warm, fontWeight: 700 }, time: { fontSize: 78 * k, fontWeight: 700, color: "#ffffff" } }}
    />
  );
  return (
    <DailyShell
      props={props}
      pad={[400, 86, 60]}
      art={
        <Art style={{ background: glow(theme) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <Lanterns warm={warm} height={400 * k} />
          </div>
        </Art>
      }
    >
      <div style={{ textAlign: "center", fontSize: 32 * k, letterSpacing: "0.3em", textTransform: "uppercase", color: warm, fontWeight: 700 }}>{label("prayerTimes", d.lang)}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 14 * k }}>
        <Mark props={props} d={d} size={92} bg={alpha(warm, 0.18)} color={warm} border={`3px solid ${warm}`} />
        <div style={{ fontFamily: d.displayFont, fontSize: 132 * k, lineHeight: 1.05, textAlign: "center", overflowWrap: "anywhere" }}>{d.title}</div>
      </div>
      <div style={{ textAlign: "center", fontSize: 34 * k, opacity: 0.75, marginTop: 10 * k }}>
        {d.gregorianShort} · {d.hijri}
      </div>
      <SubLine props={props} style={{ textAlign: "center", fontSize: 30 * k, fontStyle: "italic", color: warm, marginTop: 8 * k }} />
      {props.state.showNext && d.next && (
        <div
          style={{
            margin: `${32 * k}px auto 0`,
            padding: `${20 * k}px 46px`,
            borderRadius: 99,
            background: alpha(warm, 0.22),
            border: `3px solid ${alpha(warm, 0.6)}`,
            fontSize: 34 * k,
            fontWeight: 700,
          }}
        >
          {label("nextPrayer", d.lang)} · {label(d.next.key, d.lang)} {d.next.inText}
        </div>
      )}
      {d.ramadanFirst && fast}
      <div style={{ marginTop: 34 * k }}>
        <PrayerRows
          d={d}
          look={{
            size: 46,
            gap: 10,
            row: (now) => ({
              padding: `${19 * k}px 44px`,
              borderRadius: 99,
              background: now ? `linear-gradient(90deg, ${warm}, ${alpha(warm, 0.75)})` : "rgba(255,255,255,.07)",
              color: now ? deep : undefined,
            }),
            arabic: (now) => ({ color: now ? deep : warm }),
          }}
        />
      </div>
      {!d.ramadanFirst && fast}
      <Extras props={props} d={d} color={theme.fg} accent={warm} />
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, accent, kind) => ({
    art: (
      <div style={{ position: "absolute", inset: 0, background: glow(theme) }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: kind === "year" ? "45%" : "60%" }}>
          <Lanterns warm={accent} height={kind === "year" ? 90 : 150} wide />
        </div>
      </div>
    ),
    bg: theme.sky[2],
    color: theme.fg,
    sub: alpha(accent, 0.9),
  }),
  headFont: "var(--font-serif)",
  bodyBg: (theme) => theme.sky[2],
  table: (theme, accent) =>
    baseTable(theme, accent, {
      headColor: accent,
      stripe: (i) => (i % 2 === 0 ? "rgba(255,255,255,.05)" : undefined),
      todayStyle: { background: accent, color: theme.sky[2], fontWeight: 700 },
      hijriColor: alpha(theme.fg, 0.55),
      specialBg: alpha(accent, 0.18),
      pillRows: true,
    }),
  year: (_theme, accent) => ({ panelBg: "rgba(255,255,255,.05)", panelBorder: alpha(accent, 0.35), headColor: accent, radius: 12 }),
};

export const LanternMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const LanternYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
