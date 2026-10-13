import type { TemplateProps } from "../registry";
import type { ThemeTokens } from "../themes";
import { ARABIC_FONT, alpha } from "./common";
import { Art, DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

/** A faint woven diamond lattice, like the Kaaba's cover cloth. */
function weave(gold: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M28 4L52 28L28 52L4 28Z' fill='none' stroke='${gold}' stroke-opacity='.1' stroke-width='1.6'/><circle cx='28' cy='28' r='3.5' fill='${gold}' fill-opacity='.09'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The gold calligraphy belt with diamond studs at each end. */
function Belt({ theme, gold, text, height, size }: { theme: ThemeTokens; gold: string; text: string; height: number; size: number }) {
  const [band, , edge] = theme.sky;
  const stud = { position: "absolute" as const, top: "50%", width: height * 0.27, height: height * 0.27, border: `${Math.max(3, height * 0.03)}px solid ${gold}`, transform: "translateY(-50%) rotate(45deg)" };
  return (
    <div
      style={{
        position: "relative",
        height,
        flex: "none",
        background: `linear-gradient(180deg, ${edge}, ${band} 20%, ${band} 80%, ${edge})`,
        borderBlock: `${Math.max(4, height * 0.035)}px solid ${gold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <span style={{ ...stud, left: height * 0.2 }} />
      <span style={{ ...stud, right: height * 0.2 }} />
      <span style={{ fontFamily: ARABIC_FONT, fontSize: size, color: gold, whiteSpace: "nowrap", textShadow: `0 0 ${size * 0.2}px ${alpha(gold, 0.4)}` }}>{text}</span>
    </div>
  );
}

export function KiswaDaily(props: TemplateProps) {
  const { theme } = props;
  const d = useDaily(props);
  if (!d.today) return <NoDay props={props} />;
  const gold = d.accent;
  const k = d.k;
  const fast = (
    <FastPair
      d={d}
      style={{ marginTop: d.ramadanFirst ? 36 * k : 50 * k }}
      look={{ label: { fontSize: 30 * k, letterSpacing: "0.2em", textTransform: "uppercase", color: gold }, time: { fontSize: 78 * k, fontWeight: 700, color: theme.fg } }}
    />
  );
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DailyShell
        props={props}
        pad={[172, 86, 76]}
        art={<Art style={{ backgroundImage: weave(gold), backgroundSize: "56px 56px" }} />}
      >
        <div style={{ marginInline: -86 }}>
          <Belt theme={theme} gold={gold} text={d.arabicTitle} height={238 * k} size={118 * k} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 50 * k }}>
          <Mark props={props} d={d} size={90} bg={alpha(gold, 0.12)} color={gold} border={`3px solid ${gold}`} />
          <div style={{ fontFamily: d.displayFont, fontSize: 116 * k, letterSpacing: "0.04em", textTransform: "uppercase", color: gold, textAlign: "center", overflowWrap: "anywhere" }}>{d.title}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 34 * k, opacity: 0.75, marginTop: 10 * k }}>
          {d.gregorian} · {d.hijri}
        </div>
        <SubLine props={props} style={{ textAlign: "center", fontSize: 30 * k, fontStyle: "italic", color: gold, marginTop: 8 * k }} />
        {d.ramadanFirst && fast}
        <div style={{ marginTop: 52 * k }}>
          <PrayerRows
            d={d}
            look={{
              size: 45,
              row: (now) => ({ padding: `${26 * k}px 6px`, borderBottom: `3px solid ${alpha(gold, 0.25)}`, color: now ? gold : undefined }),
              arabic: () => ({ color: alpha(gold, 0.8) }),
              nowMark: "✦ ",
            }}
          />
        </div>
        {!d.ramadanFirst && fast}
        <Extras props={props} d={d} color={theme.fg} accent={gold} />
      </DailyShell>
    </div>
  );
}

const SPEC: PageSpec = {
  band: (theme, accent, kind) => ({
    art: (
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${theme.sky[2]}, ${theme.sky[0]} 20%, ${theme.sky[0]} 80%, ${theme.sky[2]})`, borderBottom: `5px solid ${accent}` }}>
        <span
          style={{
            position: "absolute",
            insetInlineEnd: 50,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: ARABIC_FONT,
            fontSize: kind === "year" ? 54 : 84,
            color: accent,
            opacity: 0.9,
          }}
        >
          مواقيت الصلاة
        </span>
      </div>
    ),
    bg: theme.sky[0],
    color: accent,
    sub: alpha(theme.fg, 0.75),
  }),
  headFont: "var(--font-serif)",
  bodyBg: (theme) => theme.bg,
  table: (theme, accent) =>
    baseTable(theme, accent, {
      headColor: accent,
      headRule: `2px solid ${alpha(accent, 0.5)}`,
      stripe: (i) => (i % 2 === 0 ? "rgba(255,255,255,.04)" : undefined),
      todayStyle: { background: accent, color: theme.bg, fontWeight: 700 },
      specialBg: alpha(accent, 0.16),
    }),
  year: (_theme, accent) => ({ panelBg: "rgba(255,255,255,.04)", panelBorder: alpha(accent, 0.3), headColor: accent, radius: 4 }),
};

export const KiswaMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const KiswaYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
