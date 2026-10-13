import { label, toNumerals } from "@/lib/i18n";
import type { TemplateProps } from "../registry";
import { alpha, hijriMonthShort, useNow } from "./common";
import { DailyShell, Extras, FastPair, KitMonthly, KitYear, Mark, NoDay, PrayerRows, SubLine, baseTable, useDaily, type PageSpec } from "./kit";

/** No ornament: the next prayer as one huge number, then a clean list. */
export function MinimalDaily(props: TemplateProps) {
  const { theme, state, monthly } = props;
  const d = useDaily(props);
  const now = useNow();
  const today = d.today;
  if (!today) return <NoDay props={props} />;
  const acc = d.accent;
  const k = d.k;
  const heroKey = state.showNext && d.nextKey ? d.nextKey : "fajr";
  const heroIso =
    state.showNext && d.next && d.current === "isha" && heroKey === "fajr"
      ? (monthly.days[monthly.days.findIndex((x) => x.dateISO === today.dateISO) + 1]?.prayers.fajr ?? today.prayers.fajr)
      : today.prayers[heroKey];
  const hero = d.fmt(heroIso);
  // Progress from the previous prayer to the next one.
  const prevIso = d.current ? today.prayers[d.current] : today.prayers.fajr;
  const span = new Date(heroIso).getTime() - new Date(prevIso).getTime();
  const done = span > 0 ? Math.min(1, Math.max(0, (now - new Date(prevIso).getTime()) / span)) : 0;
  const rule = alpha(theme.fg, 0.14);

  return (
    <DailyShell props={props} pad={[96, 86, 76]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 34 * k, fontWeight: 600, color: alpha(theme.fg, 0.6) }}>
        <span>{d.gregorianShort}</span>
        <span>
          {toNumerals(`${today.hijri.day} ${hijriMonthShort(today.hijri.monthName)} ${today.hijri.year}`, d.numerals)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 * k }}>
        <Mark props={props} d={d} size={84} bg={alpha(acc, 0.12)} color={acc} />
        <div style={{ fontSize: 40 * k, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", overflowWrap: "anywhere" }}>{d.title}</div>
      </div>
      <SubLine props={props} style={{ fontSize: 30 * k, color: alpha(theme.fg, 0.6), marginTop: 6 * k }} />

      <div style={{ marginTop: 110 * k, fontSize: 38 * k, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: acc }}>
        {state.showNext && d.next ? `${label("nextPrayer", d.lang)} · ${label(heroKey, d.lang)}` : label(heroKey, d.lang)}
      </div>
      <div style={{ fontSize: 290 * k, fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 0.9, marginTop: 14 * k, fontVariantNumeric: "tabular-nums" }}>
        {hero.clock}
        {hero.meridiem && <span style={{ fontSize: 80 * k, letterSpacing: 0, marginInlineStart: 14 }}>{hero.meridiem}</span>}
      </div>
      {state.showNext && d.next && <div style={{ fontSize: 46 * k, marginTop: 22 * k, color: alpha(theme.fg, 0.7) }}>{d.next.inText}</div>}
      {state.showNext && d.next && (
        <div style={{ height: 15 * k, borderRadius: 99, background: rule, marginTop: 50 * k, overflow: "hidden" }}>
          <i style={{ display: "block", height: "100%", width: `${done * 100}%`, background: acc, borderRadius: 99 }} />
        </div>
      )}
      <FastPair
        d={d}
        style={{ marginTop: 56 * k, textAlign: "start" }}
        look={{ label: { fontSize: 30 * k, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: alpha(theme.fg, 0.55) }, time: { fontSize: 64 * k, fontWeight: 800, letterSpacing: "-0.02em" }, meridiem: true }}
      />

      <div style={{ marginTop: "auto" }}>
        <PrayerRows
          d={d}
          look={{
            size: 46,
            row: (now) => ({ padding: `${24 * k}px 0`, borderTop: `3px solid ${rule}`, color: now ? acc : undefined, fontWeight: now ? 700 : 500 }),
            arabic: () => ({ opacity: 0.45, fontSize: "0.85em" }),
          }}
        />
        <Extras props={props} d={d} color={theme.fg} accent={acc} align="start" />
      </div>
    </DailyShell>
  );
}

const SPEC: PageSpec = {
  band: (theme, accent) => ({
    art: <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: accent }} />,
    bg: theme.bg,
    color: theme.fg,
    sub: alpha(theme.fg, 0.6),
  }),
  headFont: "var(--font-latin)",
  table: (theme, accent) => baseTable(theme, accent, { headRule: `2px solid ${alpha(theme.fg, 0.2)}`, stripe: () => undefined }),
  year: (theme, accent) => ({ panelBg: theme.muted, panelBorder: "transparent", headColor: accent, radius: 14 }),
};

export const MinimalMonthly = (props: TemplateProps) => <KitMonthly props={props} spec={SPEC} />;
export const MinimalYear = (props: TemplateProps) => <KitYear props={props} spec={SPEC} />;
