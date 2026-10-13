import { label } from "@/lib/i18n";
import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

/** Fixed star field (same stars every render, so exports match the preview). */
function Stars() {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 46 }, (_, i) => (
        <circle key={i} cx={`${(i * 53) % 100}%`} cy={`${(i * 37) % 100}%`} r={i % 5 ? 1.6 : 2.8} fill="#ffffff" opacity={0.3 + (i % 4) * 0.15} />
      ))}
    </svg>
  );
}

/** Crescent moon: a disc lit by its inner shadow. */
function Moon({ size, colour }: { size: number; colour: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        boxShadow: `inset ${-size * 0.21}px ${size * 0.06}px 0 0 ${colour}`,
        filter: `drop-shadow(0 0 ${size * 0.16}px ${alpha(colour, 0.6)})`,
      }}
    />
  );
}

/** Domes and minarets in silhouette. */
export function Skyline({ fill, height, repeat = 1 }: { fill: string; height: number | string; repeat?: number }) {
  return (
    <svg viewBox={`0 0 ${300 * repeat} 90`} preserveAspectRatio="xMidYMax slice" width="100%" height={height} style={{ display: "block" }} fill={fill}>
      {Array.from({ length: repeat }, (_, r) => (
        <g key={r} transform={`translate(${r * 300} 0)`}>
          <rect x={10} y={50} width={70} height={40} />
          <path d="M20 50 Q45 14 70 50Z" />
          <rect x={44} y={6} width={2} height={12} />
          <rect x={84} y={18} width={9} height={72} />
          <path d="M82 20 L88.5 4 L95 20Z" />
          <rect x={82} y={40} width={13} height={3} />
          <rect x={100} y={56} width={50} height={34} />
          <path d="M106 56 Q125 30 144 56Z" />
          <rect x={150} y={38} width={80} height={52} />
          <path d="M160 38 Q190 -6 220 38Z" />
          <rect x={189} y={0} width={2} height={10} />
          <rect x={236} y={22} width={9} height={68} />
          <path d="M234 24 L240.5 8 L247 24Z" />
          <rect x={234} y={44} width={13} height={3} />
          <rect x={250} y={60} width={50} height={30} />
          <path d="M256 60 Q275 38 294 60Z" />
        </g>
      ))}
    </svg>
  );
}

const sky = (theme: ThemeTokens) => `linear-gradient(180deg, ${theme.sky[0]}, ${theme.sky[1]} 55%, ${theme.sky[2]})`;

export function CrescentDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const moon = d.accent;
  const k = d.k;
  const ground = theme.sky[2];
  const fast = (
    <FastPair
      d={d}
      style={{ marginTop: d.ramadanFirst ? 0 : 36 * k, marginBottom: d.ramadanFirst ? 30 * k : 0 }}
      look={{
        gap: 30,
        box: { border: `3px solid ${alpha(moon, 0.5)}`, borderRadius: 32, padding: `${24 * k}px 10px` },
        label: { fontSize: 29 * k, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: moon },
        time: { fontSize: 70 * k, fontWeight: 800, color: "#ffffff" },
      }}
    />
  );
  return (
    <DailyShell
      props={props}
      pad={[108, 86, 66]}
      art={
        <Art style={{ background: sky(theme) }}>
          <div style={{ position: "absolute", inset: "0 0 50% 0" }}>
            <Stars />
          </div>
          <div style={{ position: "absolute", top: 96 * k, insetInlineEnd: 96 }}>
            <Moon size={260 * k} colour={moon} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560 * k }}>
            <Skyline fill={ground} height={330 * k} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 888 * k, bottom: 0, background: ground }} />
        </Art>
      }
    >
      <div style={{ fontSize: 32 * k, letterSpacing: "0.24em", fontWeight: 700, color: moon, textTransform: "uppercase" }}>{label("prayerTimes", d.lang)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 * k, maxWidth: "70%" }}>
        <Mark props={props} d={d} size={92} bg="rgba(255,255,255,.12)" color={moon} border={`3px solid ${moon}`} />
        <div style={{ fontSize: 150 * k, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{d.title}</div>
      </div>
      <div style={{ fontSize: 35 * k, opacity: 0.75, marginTop: 16 * k }}>
        {d.gregorianShort} · {d.hijri}
      </div>
      <SubLine props={props} style={{ fontSize: 30 * k, fontStyle: "italic", color: moon, marginTop: 8 * k }} />
      {props.state.showNext && d.next && (
        <div style={{ fontSize: 33 * k, fontWeight: 700, marginTop: 14 * k, color: moon }}>
          {label("nextPrayer", d.lang)} · {label(d.next.key, d.lang)} {d.next.inText}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        {d.ramadanFirst && fast}
        <PrayerRows
          d={d}
          look={{
            size: 45,
            row: (now) => ({ padding: `${24 * k}px 0`, borderBottom: "3px solid rgba(255,255,255,.1)", color: now ? moon : undefined }),
            arabic: () => ({ color: alpha(moon, 0.75) }),
          }}
        />
        {!d.ramadanFirst && fast}
        <Extras props={props} d={d} color={theme.fg} accent={moon} />
      </div>
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, accent, kind) => ({
    art: (
      <div style={{ position: "absolute", inset: 0, background: sky(theme) }}>
        <Stars />
        <div style={{ position: "absolute", insetInlineEnd: 50, top: kind === "year" ? 14 : 28 }}>
          <Moon size={kind === "year" ? 60 : 96} colour={accent} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, opacity: 0.6 }}>
          <Skyline fill={theme.sky[2]} height={kind === "year" ? 50 : 80} repeat={kind === "year" ? 6 : 3} />
        </div>
      </div>
    ),
    bg: theme.sky[1],
    color: "#ffffff",
    sub: alpha(accent, 0.95),
    style: { paddingBottom: kind === "year" ? 40 : 70 },
  }),
  headFont: "var(--font-latin)",
  bodyBg: (theme) => theme.sky[2],
  table: (theme, accent) =>
    baseTable(theme, accent, {
      headColor: accent,
      stripe: (i) => (i % 2 === 0 ? "rgba(255,255,255,.05)" : undefined),
      todayStyle: { background: accent, color: theme.sky[2], fontWeight: 700 },
      specialBg: alpha(accent, 0.18),
    }),
  year: (_theme, accent) => ({ panelBg: "rgba(255,255,255,.05)", panelBorder: alpha(accent, 0.3), headColor: accent, radius: 12 }),
};

export const CrescentMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const CrescentYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
