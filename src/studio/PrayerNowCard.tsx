import { useEffect, useState } from "react";
import { ArrowRightIcon, MoonStarIcon, SunsetIcon } from "lucide-react";
import { getMonthly, type DayTimes } from "@/lib/miqaat";
import { formatTime } from "@/lib/format";
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

export function PrayerNowCard() {
  const { state } = useStudio();
  const { lat, lon, method, madhab, lang, numerals, hour12 } = state;

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

  if (!data) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5 text-xs text-muted-foreground">
        Loading prayer times…
      </div>
    );
  }

  const { today, tomorrow } = data;
  const fmtClock = (iso: string) =>
    formatTime(iso, { hour12, lang: numerals, timezone: data.tz });

  const events = PRAYER_ORDER.map((key) => ({ key, ms: new Date(today.prayers[key]).getTime(), iso: today.prayers[key] }));
  const nextIdx = events.findIndex((e) => e.ms > now);

  // Current window + upcoming prayer. Before Fajr the "current" window is last
  // night's Isha (whose time we don't carry, so its clock is left blank);
  // after Isha the next prayer rolls to tomorrow's Fajr.
  let current: { key: PrayerKey; iso?: string };
  let next: { key: PrayerKey; ms: number } | null;
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
  let fast: { key: Extract<LabelKey, "sehri" | "iftar">; ms: number } | null;
  if (now < sehriMs) fast = { key: "sehri", ms: sehriMs };
  else if (now < iftarMs) fast = { key: "iftar", ms: iftarMs };
  else fast = tomorrow ? { key: "sehri", ms: new Date(tomorrow.fasting.sehri).getTime() } : null;
  const FastIcon = fast?.key === "iftar" ? SunsetIcon : MoonStarIcon;

  return (
    <div
      className="rounded-lg border border-primary/25 bg-primary/[0.05] p-3"
      role="status"
      aria-live="off"
    >
      <div className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Prayer now
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Now</div>
          <div className="truncate text-sm font-semibold">{label(current.key, lang)}</div>
          <div className="text-xs tabular-nums text-muted-foreground">
            {current.iso ? fmtClock(current.iso) : " "}
          </div>
        </div>

        <ArrowRightIcon className="size-4 shrink-0 text-primary/60" aria-hidden="true" />

        <div className="min-w-0 flex-1 text-right">
          <div className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Next</div>
          <div className="truncate text-sm font-semibold text-primary">
            {next ? label(next.key, lang) : "—"}
          </div>
          <div className="text-xs tabular-nums text-primary/80">
            {next ? `in ${formatRemaining(next.ms - now)}` : " "}
          </div>
        </div>
      </div>

      {fast && (
        <div className={cn("mt-2 flex items-center gap-1.5 border-t border-primary/15 pt-2 text-xs")}>
          <FastIcon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground">{label(fast.key, lang)} in</span>
          <span className="tabular-nums font-medium">{formatRemaining(fast.ms - now)}</span>
        </div>
      )}
    </div>
  );
}

export default PrayerNowCard;
