import { useEffect, useRef, useState } from "react";
import type { Countdowns, MonthlyResponse, QiblaData } from "@/lib/miqaat";
import type { SpecialType } from "@/lib/calendar";
import type { StudioState } from "@/lib/state";
import { TEMPLATES } from "@/templates/registry";
import { THEMES } from "@/templates/themes";
import { useStudio } from "./context";

type PreviewStageProps = {
  monthly: MonthlyResponse | null;
  qibla: QiblaData | null;
  countdowns: Countdowns | null;
  specialDays: Record<string, SpecialType[]>;
  loading: boolean;
  error: string | null;
};

// Intrinsic export-canvas pixel size per format. Daily defaults to a 9:16
// "Story" canvas (1080x1920) per the task brief; monthly/year get a
// reasonable placeholder size until their templates land in Tasks 11-12.
const INTRINSIC_SIZE: Record<StudioState["format"], { width: number; height: number }> = {
  daily: { width: 1080, height: 1920 },
  monthly: { width: 1080, height: 1350 },
  year: { width: 1080, height: 1080 },
};

const STAGE_PADDING = 32;

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
  loading,
  error,
}: PreviewStageProps) {
  const { state } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const intrinsic = INTRINSIC_SIZE[state.format];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const availW = el.clientWidth - STAGE_PADDING * 2;
      const availH = el.clientHeight - STAGE_PADDING * 2;
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
      className="flex h-full w-full items-center justify-center overflow-auto p-8"
    >
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
        <div style={{ width: intrinsic.width * scale, height: intrinsic.height * scale }}>
          <div
            id="export-node"
            className="overflow-hidden shadow-xl"
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
