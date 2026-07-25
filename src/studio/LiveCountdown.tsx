import { useEffect, useState, type ReactNode } from "react";
import { Check, MoonStar, Sunset } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { MonthlyResponse } from "@/lib/miqaat";
import type { StudioState } from "@/lib/state";
import { pickToday } from "@/templates/daily/shared";

export type LiveCountdownProps = {
  monthly: MonthlyResponse;
  state: StudioState;
  /**
   * When true, renders a static (non-ticking) snapshot instead of a live
   * "in Xh Ym Zs" countdown. Set by the export pipeline (Task 16) around the
   * html-to-image capture so exported images never contain a
   * moment-in-time-dependent string. See `src/studio/context.ts`'s
   * `exporting`/`setExporting`, which `PreviewStage` threads into this prop.
   */
  frozen?: boolean;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** The shared chip chrome, floated in the top-right corner of the preview stage. */
function Pill({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur lg:right-4 lg:top-4"
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}

/**
 * In-app-only "Sehri ends in…/Iftar in…" ticker for the daily preview.
 * Ticks every second via `setInterval` (cleaned up on unmount/frozen change).
 * Deliberately rendered by `PreviewStage` in the chrome AROUND `#export-node`,
 * not inside it, so it never appears in exported images regardless of
 * `frozen` — `frozen` exists as a belt-and-suspenders seam in case a future
 * template ever renders this (or something like it) inside the export node.
 *
 * The live ticker is a *today* affordance: it counts the real "now" down to
 * the next sehri/iftar. Counting to an arbitrarily-selected preview date would
 * show nonsense (e.g. "in 1929h" for a date months away), so the live chip
 * only appears when the previewed day IS the current day in the schedule's
 * timezone; on any other date it renders nothing.
 *
 * Never calls `Date.now()`/`new Date()` at module top-level: the initial
 * "now" is captured lazily via `useState`'s initializer (which only runs on
 * first render, not at import time), and subsequent updates happen inside the
 * `setInterval` callback.
 */
export function LiveCountdown({ monthly, state, frozen = false }: LiveCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [frozen]);

  const today = pickToday(monthly, state);
  if (!today) return null;

  // Is the previewed day the actual current day (in the schedule's timezone,
  // not the browser's local date, which can differ near midnight)?
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: monthly.location.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  const isToday = today.dateISO === todayISO;

  // The live countdown / "fasting complete" state only makes sense for today.
  // (The frozen export snapshot is a plain time, harmless on any date.)
  if (!frozen && !isToday) return null;

  const sehriMs = new Date(today.fasting.sehri).getTime();
  const iftarMs = new Date(today.fasting.iftar).getTime();

  // Always count to the next event so the ticker is never blank: before
  // sehri → sehri, before iftar → iftar, and after iftar it rolls over to
  // TOMORROW's sehri (the next day in the fetched month). On the month's last
  // day tomorrow isn't in `monthly`, so it falls back to a "complete" note.
  let next: { key: "sehri" | "iftar"; targetMs: number; iso: string } | null;
  if (now < sehriMs) {
    next = { key: "sehri", targetMs: sehriMs, iso: today.fasting.sehri };
  } else if (now < iftarMs) {
    next = { key: "iftar", targetMs: iftarMs, iso: today.fasting.iftar };
  } else {
    const idx = monthly.days.findIndex((d) => d.dateISO === today.dateISO);
    const tomorrow = idx >= 0 ? monthly.days[idx + 1] : undefined;
    next = tomorrow
      ? {
          key: "sehri",
          targetMs: new Date(tomorrow.fasting.sehri).getTime(),
          iso: tomorrow.fasting.sehri,
        }
      : null;
  }

  if (!next) {
    return (
      <Pill>
        <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium text-muted-foreground">Fasting complete for today</span>
      </Pill>
    );
  }

  const Icon = next.key === "sehri" ? MoonStar : Sunset;
  const eventLabel = next.key === "sehri" ? "Sehri ends" : "Iftar";

  if (frozen) {
    // Static snapshot: a fixed clock time, never "in Xs" phrasing, no ticking.
    const clock = formatTime(next.iso, {
      hour12: state.hour12,
      lang: state.numerals,
      timezone: monthly.location.timezone,
    });
    return (
      <Pill>
        <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium">
          <span className="text-muted-foreground">{eventLabel} at </span>
          <span className="tabular-nums text-foreground">{clock}</span>
        </span>
      </Pill>
    );
  }

  return (
    <Pill>
      {/* A pulsing dot marks the chip as live/ticking. */}
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="font-medium">
        <span className="text-muted-foreground">{eventLabel} in </span>
        <span className="tabular-nums text-foreground">{formatRemaining(next.targetMs - now)}</span>
      </span>
    </Pill>
  );
}

export default LiveCountdown;
