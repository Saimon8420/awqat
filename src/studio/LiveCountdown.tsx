import { useEffect, useState } from "react";
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

/**
 * In-app-only "Sehri ends in…/Iftar in…" ticker for the daily preview.
 * Ticks every second via `setInterval` (cleaned up on unmount/frozen
 * change). Deliberately rendered by `PreviewStage` in the chrome AROUND
 * `#export-node`, not inside it, so it never appears in exported images
 * regardless of `frozen` — `frozen` exists as a belt-and-suspenders seam in
 * case a future template ever renders this (or something like it) inside
 * the export node.
 *
 * Never calls `Date.now()`/`new Date()` at module top-level: the initial
 * "now" is captured lazily via `useState`'s initializer (which only runs on
 * first render, not at import time), and subsequent updates happen inside
 * the `setInterval` callback.
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

  const sehriMs = new Date(today.fasting.sehri).getTime();
  const iftarMs = new Date(today.fasting.iftar).getTime();

  const next =
    now < sehriMs
      ? { key: "sehri" as const, targetMs: sehriMs, iso: today.fasting.sehri }
      : now < iftarMs
        ? { key: "iftar" as const, targetMs: iftarMs, iso: today.fasting.iftar }
        : null;

  if (!next) {
    return (
      <p className="text-xs font-medium text-muted-foreground" role="status">
        Fasting complete for today
      </p>
    );
  }

  const eventLabel = next.key === "sehri" ? "Sehri ends" : "Iftar";

  if (frozen) {
    // Static snapshot: a fixed clock time, never "in Xs" phrasing, and no
    // ticking (no interval is even started above while frozen).
    const clock = formatTime(next.iso, {
      hour12: state.hour12,
      lang: state.numerals,
      timezone: monthly.location.timezone,
    });
    return (
      <p className="text-xs font-medium text-muted-foreground" role="status">
        {eventLabel} at {clock}
      </p>
    );
  }

  return (
    <p className="text-xs font-medium text-muted-foreground" role="status" aria-live="polite">
      {eventLabel} in {formatRemaining(next.targetMs - now)}
    </p>
  );
}

export default LiveCountdown;
