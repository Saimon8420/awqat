import { label } from "@/lib/i18n";
import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

function Palm({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M0 0 Q2 -18 -1 -36" stroke={fill} strokeWidth={2.4} fill="none" />
      <path d="M-1 -36 Q-14 -40 -22 -30 Q-12 -36 -1 -34Z M-1 -36 Q12 -42 22 -32 Q10 -37 -1 -34Z M-1 -36 Q-8 -48 -18 -46 Q-8 -44 -1 -35Z M-1 -36 Q8 -50 18 -48 Q8 -45 -1 -35Z" />
    </g>
  );
}

function Camel({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <path transform={`translate(${x} ${y})`} fill={fill} d="M0 0 L1 -7 Q2 -12 6 -12 Q8 -16 11 -12 Q13 -15 15 -12 L17 -14 Q19 -15 19 -12 L18 -9 L16 -8 L15 0 H14 L13.5 -6 H4 L3 0Z" />;
}

/** Sunset sky, a low sun, three dune ridges, a caravan and palms. */
export function Dunes({ theme, height, wide = false }: { theme: ThemeTokens; height: number | string; wide?: boolean }) {
  const [sun, d1, d2, d3] = theme.art ?? ["#ffe2a6", "#c8593e", "#8f3a3c", "#3a1626"];
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio={wide ? "xMidYMax slice" : "xMidYMax slice"} width="100%" height={height} style={{ display: "block" }}>
      <circle cx={140} cy={86} r={34} fill={sun} opacity={0.18} />
      <circle cx={140} cy={86} r={22} fill={sun} opacity={0.95} />
      <path d="M0 104 Q40 88 80 100 T160 96 T200 102 V140 H0Z" fill={d1} />
      <path d="M0 118 Q50 104 100 116 T200 112 V140 H0Z" fill={d2} />
      <Camel x={52} y={128} fill={d3} />
      <Camel x={70} y={128} fill={d3} />
      <Camel x={86} y={128} fill={d3} />
      <Palm x={22} y={132} s={1} fill={d3} />
      <Palm x={36} y={134} s={0.75} fill={d3} />
      <Palm x={182} y={134} s={0.9} fill={d3} />
      <path d="M0 130 Q60 122 120 132 T200 128 V140 H0Z" fill={d3} />
    </svg>
  );
}

const sky = (theme: ThemeTokens) => `linear-gradient(180deg, ${theme.sky[0]} 0%, ${theme.sky[1]} 38%, ${theme.sky[2]} 62%)`;

export function DesertDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const acc = d.accent;
  const k = d.k;
  const ink = theme.fg;
  const fast = (
    <FastPair
      d={d}
      style={{ paddingBottom: 30 * k, marginBottom: 20 * k, borderBottom: `3px solid ${alpha(ink, 0.12)}` }}
      look={{ label: { fontSize: 29 * k, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: acc }, time: { fontSize: 72 * k, fontWeight: 700, color: ink } }}
    />
  );
  return (
    <DailyShell
      props={props}
      pad={[86, 54, 54]}
      art={
        <Art style={{ background: sky(theme) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <Dunes theme={theme} height={842 * k} />
          </div>
        </Art>
      }
    >
      <div style={{ textAlign: "center", color: "#ffffff" }}>
        <div style={{ fontSize: 31 * k, letterSpacing: "0.3em", fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>{label("prayerTimes", d.lang)}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 16 * k }}>
          <Mark props={props} d={d} size={92} bg="rgba(255,255,255,.2)" color="#ffffff" border="3px solid rgba(255,255,255,.6)" />
          <div style={{ fontFamily: d.displayFont, fontSize: 140 * k, lineHeight: 1, textShadow: "0 6px 22px rgba(0,0,0,.25)", overflowWrap: "anywhere" }}>{d.title}</div>
        </div>
        <div style={{ fontSize: 35 * k, opacity: 0.92, marginTop: 16 * k }}>
          {d.gregorianShort} · {d.hijri}
        </div>
        <SubLine props={props} style={{ fontSize: 30 * k, fontStyle: "italic", marginTop: 8 * k }} />
        {props.state.showNext && d.next && (
          <div style={{ fontSize: 32 * k, fontWeight: 700, marginTop: 14 * k }}>
            {label("nextPrayer", d.lang)} · {label(d.next.key, d.lang)} {d.next.inText}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "auto",
          background: "rgba(255,255,255,.92)",
          color: ink,
          borderRadius: 54,
          padding: `${48 * k}px 54px ${36 * k}px`,
          boxShadow: "0 30px 80px -30px rgba(0,0,0,.45)",
        }}
      >
        {fast}
        <PrayerRows
          d={d}
          look={{
            size: 44,
            row: (now) => ({ padding: `${20 * k}px 22px`, borderRadius: 26, background: now ? acc : undefined, color: now ? "#ffffff" : undefined }),
            arabic: (now) => ({ color: now ? "#ffffff" : alpha(acc, 0.85) }),
          }}
        />
        <Extras props={props} d={d} color={ink} accent={acc} />
      </div>
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, _accent, kind) => ({
    art: (
      <div style={{ position: "absolute", inset: 0, background: sky(theme) }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Dunes theme={theme} height="100%" wide />
        </div>
      </div>
    ),
    bg: theme.sky[1],
    color: "#ffffff",
    sub: "rgba(255,255,255,.9)",
    style: { paddingBottom: kind === "year" ? 40 : 80, textShadow: "0 3px 14px rgba(0,0,0,.3)" },
  }),
  headFont: "var(--font-serif)",
  table: (theme, accent) => baseTable(theme, accent, { pillRows: true }),
  year: (_theme, accent) => ({ panelBg: "#ffffff", panelBorder: alpha(accent, 0.25), headColor: accent, radius: 12 }),
};

export const DesertMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const DesertYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
