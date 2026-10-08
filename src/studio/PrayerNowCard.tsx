import { useEffect, useState } from "react";
import { MoonStarIcon, SunsetIcon } from "lucide-react";
import { getMonthly, type DayTimes } from "@/lib/miqaat";
import { label, type LabelKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useStudio } from "./context";

/**
 * A live "what's the prayer situation right now" card for the left sidebar.
 *
 * Unlike the poster (which the user aims at any date/month), this is always
 * anchored to the real *now* for the selected location and calculation
 * method: it shows the current prayer window and the next prayer with a
 * ticking countdown, plus the next fasting event (Sehri/Iftar). It fetches the
 * *current* month directly (getMonthly is cached, so when the poster is
 * already on this month it's free) rather than reading the poster's `monthly`,
 * which may be pointed at some other month entirely.
 *
 * Lives outside `#export-node`, so it never appears in exported images.
 */

const PRAYER_ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof PRAYER_ORDER)[number];

/** The current calendar date in `tz`, as YYYY-MM-DD, for `nowMs`. */
function todayISOIn(tz: string, nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

/** "2h 5m" / "5m 12s" / "12s" — coarse enough for a glanceable sidebar chip. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type Loaded = { today: DayTimes; tomorrow: DayTimes | undefined; tz: string };

export type PrayerNow = {
  current: { key: PrayerKey; iso?: string };
  next: { key: PrayerKey; ms: number } | null;
  fast: { key: Extract<LabelKey, "sehri" | "iftar">; ms: number } | null;
  now: number;
  tz: string;
};

/**
 * The real "now" for the chosen place + method: the current prayer window,
 * the next prayer, and the next fasting event, ticking every second. Always
 * anchored to today, whatever date the poster shows.
 */
export function usePrayerNow(): PrayerNow | "loading" | null {
  const { state } = useStudio();
  const { lat, lon, method, madhab } = state;

  const [now, setNow] = useState(() => Date.now());
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetch the *current* month for this location + method. Re-runs when the
  // place or calculation inputs change; getMonthly caches per those keys.
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const nowD = new Date();
    getMonthly({ lat, lon, year: nowD.getFullYear(), month: nowD.getMonth() + 1, method, madhab })
      .then((m) => {
        if (cancelled) return;
        const tz = m.location.timezone;
        const iso = todayISOIn(tz, Date.now());
        const idx = m.days.findIndex((d) => d.dateISO === iso);
        if (idx < 0) {
          setFailed(true);
          return;
        }
        setData({ today: m.days[idx], tomorrow: m.days[idx + 1], tz });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, method, madhab]);

  // Tick once a second so the countdowns stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (failed) return null;
  if (!data) return "loading";

  const { today, tomorrow } = data;
  const events = PRAYER_ORDER.map((key) => ({ key, ms: new Date(today.prayers[key]).getTime(), iso: today.prayers[key] }));
  const nextIdx = events.findIndex((e) => e.ms > now);

  // Current window + upcoming prayer. Before Fajr the "current" window is last
  // night's Isha (whose time we don't carry, so its clock is left blank);
  // after Isha the next prayer rolls to tomorrow's Fajr.
  let current: PrayerNow["current"];
  let next: PrayerNow["next"];
  if (nextIdx === -1) {
    current = { key: "isha", iso: today.prayers.isha };
    next = tomorrow ? { key: "fajr", ms: new Date(tomorrow.prayers.fajr).getTime() } : null;
  } else if (nextIdx === 0) {
    current = { key: "isha" };
    next = { key: events[0].key, ms: events[0].ms };
  } else {
    current = { key: events[nextIdx - 1].key, iso: events[nextIdx - 1].iso };
    next = { key: events[nextIdx].key, ms: events[nextIdx].ms };
  }

  // Next fasting event: before Sehri → Sehri, before Iftar → Iftar, else
  // tomorrow's Sehri (if the fetched month still has a tomorrow).
  const sehriMs = new Date(today.fasting.sehri).getTime();
  const iftarMs = new Date(today.fasting.iftar).getTime();
  let fast: PrayerNow["fast"];
  if (now < sehriMs) fast = { key: "sehri", ms: sehriMs };
  else if (now < iftarMs) fast = { key: "iftar", ms: iftarMs };
  else fast = tomorrow ? { key: "sehri", ms: new Date(tomorrow.fasting.sehri).getTime() } : null;

  return { current, next, fast, now, tz: data.tz };
}

/**
 * The top bar's live status chip: "● Isha now · Fajr in 3h 19m", with the next
 * Sehri/Iftar countdown in its tooltip. Lives outside `#export-node`, so it
 * never appears in exported images.
 */
export function NowChip({ className }: { className?: string }) {
  const { state } = useStudio();
  const live = usePrayerNow();
  if (live === null) return null;
  if (live === "loading") {
    return (
      <span className={cn("inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground", className)}>
        Loading times…
      </span>
    );
  }
  const { current, next, fast, now } = live;
  const FastIcon = fast?.key === "iftar" ? SunsetIcon : MoonStarIcon;
  return (
    <span
      role="status"
      aria-live="off"
      title={fast ? `${label(fast.key, state.lang)} in ${formatRemaining(fast.ms - now)}` : undefined}
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <span className="truncate">
        {label(current.key, state.lang)} now
        {next && (
          <>
            {" · "}
            {label(next.key, state.lang)} in <span className="tabular-nums">{formatRemaining(next.ms - now)}</span>
          </>
        )}
      </span>
      {fast && (
        <span className="hidden items-center gap-1 border-l border-border pl-2 font-medium text-muted-foreground xl:inline-flex">
          <FastIcon className="size-3.5 text-primary" aria-hidden="true" />
          {label(fast.key, state.lang)} {formatRemaining(fast.ms - now)}
        </span>
      )}
    </span>
  );
}
