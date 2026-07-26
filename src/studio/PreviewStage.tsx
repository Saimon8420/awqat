import { useEffect, useRef, useState } from "react";
import type { Countdowns, MonthlyResponse, QiblaData } from "@/lib/miqaat";
import type { SpecialType } from "@/lib/calendar";
import type { StudioState } from "@/lib/state";
import { TEMPLATES } from "@/templates/registry";
import { THEMES } from "@/templates/themes";
import { useStudio } from "./context";
import { LiveCountdown } from "./LiveCountdown";

type PreviewStageProps = {
  monthly: MonthlyResponse | null;
  qibla: QiblaData | null;
  countdowns: Countdowns | null;
  specialDays: Record<string, SpecialType[]>;
  months: MonthlyResponse[] | null;
  loading: boolean;
  error: string | null;
};

// Intrinsic export-canvas pixel size per format/ratio. The `daily` format
// offers a choice of export aspect ratios (see `ExportBar`, Task 16) — Story
// 9:16, Square 1:1, Post 4:5 — all sharing the same 1080px width so a single
// `targetWidth` works for all three. `monthly` gets a fixed portrait poster
// size; `year` uses a landscape A3-proportioned canvas (420x297mm at 96dpi)
// so the 4x3 grid of month panels in YearPoster has room to breathe. Neither
// participates in the ratio toggle.
const DAILY_RATIO_SIZE: Record<
  NonNullable<StudioState["exportRatio"]>,
  { width: number; height: number }
> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  post: { width: 1080, height: 1350 },
};

function intrinsicSizeFor(state: StudioState): { width: number; height: number } {
  if (state.format === "daily") return DAILY_RATIO_SIZE[state.exportRatio ?? "story"];
  if (state.format === "monthly") {
    // Monthly follows the Orientation toggle live: a portrait poster or a
    // landscape sheet (√2 proportions, so it drops cleanly onto A4/A3).
    return state.orientation === "landscape"
      ? { width: 1528, height: 1080 }
      : { width: 1080, height: 1350 };
  }
  return { width: 1587, height: 1123 };
}

/**
 * Breathing room around the scaled canvas, read from the container's own
 * computed padding so the fit math always matches what CSS actually applied
 * (the stage is tighter on a phone, where every pixel of canvas counts).
 */
function stagePadding(el: HTMLElement): { x: number; y: number } {
  if (typeof getComputedStyle !== "function") return { x: 32, y: 32 };
  const cs = getComputedStyle(el);
  return {
    x: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
    y: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
  };
}

/**
 * The center preview region: a fixed-aspect `#export-node` canvas, scaled
 * with a CSS transform to fit the available space, that renders the
 * currently-selected template with the fetched Miqaat data.
 */
export function PreviewStage({
  monthly,
  qibla,
  countdowns,
  specialDays,
  months,
  loading,
  error,
}: PreviewStageProps) {
  const { state, exporting } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const intrinsic = intrinsicSizeFor(state);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const pad = stagePadding(el);
      const availW = el.clientWidth - pad.x;
      const availH = el.clientHeight - pad.y;
      const next = Math.min(availW / intrinsic.width, availH / intrinsic.height, 1);
      setScale(next > 0 ? next : 1);
    };

    compute();

    // jsdom (the test environment) has no ResizeObserver — skip live
    // resizing there; the initial compute() above still runs.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [intrinsic.width, intrinsic.height]);

  const templateDef = TEMPLATES.find((t) => t.id === state.template);
  const theme = THEMES.find((t) => t.id === state.theme) ?? THEMES[0];

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto p-3 lg:p-8"
    >
      {/* In-app-only live countdown chrome: intentionally rendered here,
          outside #export-node, so it never appears in exported images (see
          LiveCountdown's doc comment). `frozen` is threaded from the studio
          context's `exporting` flag as a belt-and-suspenders seam for Task
          16's export pipeline. */}
      {state.format === "daily" && monthly && (
        <LiveCountdown monthly={monthly} state={state} frozen={exporting} />
      )}

      {loading && !monthly && (
        <p className="text-sm text-muted-foreground" role="status">
          Loading prayer times…
        </p>
      )}

      {error && !monthly && (
        <p className="text-sm text-destructive" role="alert">
          Couldn&apos;t load prayer times: {error}
        </p>
      )}

      {!loading && !error && !monthly && (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      )}

      {monthly && templateDef && (
        // Sizing box: exactly the *scaled* footprint. It carries the drop
        // shadow and clips the child — #export-node keeps its full intrinsic
        // width and is only visually shrunk by the transform, so its unscaled
        // layout box would otherwise overflow this wrapper and leak a
        // horizontal scrollbar into PreviewStage's scroll container. That
        // overflow flips to the left under dir="rtl" (Arabic), which is why the
        // stray scrollbar only showed there; clipping here fixes both
        // directions. An element's own box-shadow isn't clipped by its own
        // overflow-hidden, so the shadow survives the move off the node.
        <div
          className="overflow-hidden shadow-xl"
          style={{ width: intrinsic.width * scale, height: intrinsic.height * scale }}
        >
          <div
            id="export-node"
            className="overflow-hidden"
            style={{
              width: intrinsic.width,
              height: intrinsic.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <templateDef.Component
              monthly={monthly}
              qibla={qibla ?? undefined}
              countdowns={countdowns ?? undefined}
              specialDays={specialDays}
              months={months ?? undefined}
              state={state}
              theme={theme}
            />
          </div>
        </div>
      )}

      {monthly && !templateDef && (
        <p className="text-sm text-muted-foreground">No template selected for this format yet.</p>
      )}
    </div>
  );
}

export default PreviewStage;
