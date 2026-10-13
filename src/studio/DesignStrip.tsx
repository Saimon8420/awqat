import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { MonthlyResponse } from "@/lib/miqaat";
import type { StudioState } from "@/lib/state";
import { cn } from "@/lib/utils";
import { DESIGNS, designById } from "@/templates/registry";
import { THEMES, resolveTheme, type ThemeTokens } from "@/templates/themes";
import { useStudio } from "./context";

const CARD_W = 1080;
const CARD_H = 1920;

/**
 * A real, scaled-down daily card for one design + colour, rendered with the
 * live times so picking a look is "what you see". Decorations the user added
 * (photo, gradient, ornament, radius) are left off so each thumb shows the
 * design itself.
 */
export const DesignThumb = memo(function DesignThumb({
  design,
  theme,
  monthly,
  state,
  width,
}: {
  design: string;
  theme: ThemeTokens;
  monthly: MonthlyResponse;
  state: StudioState;
  width: number;
}) {
  const Daily = designById(design).components.daily;
  const scale = width / CARD_W;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none overflow-hidden"
      style={{ width, height: CARD_H * scale }}
    >
      <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "top left" }} dir="ltr">
        <Daily
          monthly={monthly}
          specialDays={{}}
          theme={theme}
          state={{
            ...state,
            format: "daily",
            exportRatio: "story",
            template: theme.design,
            theme: theme.id,
            accent: "",
            bgImage: undefined,
            gradient: undefined,
            motif: undefined,
            radius: undefined,
          }}
        />
      </div>
    </div>
  );
});

/**
 * The studio state as thumbnails see it. Thumbnails ignore the look settings
 * (accent, ornament, background, radius, format…), so a change to those keeps
 * the same object and the memoized thumbs skip re-rendering, which keeps
 * dragging a slider or the colour picker smooth.
 */
export function useThumbState(state: StudioState): StudioState {
  const { accent: _a, bgImage: _b, gradient: _g, motif: _m, radius: _r, bgDim: _d, bgBlur: _bl, format: _f, exportRatio: _e, orientation: _o, template: _t, theme: _th, ...rest } = state;
  const key = JSON.stringify(rest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => state, [key]);
}

/** Applies a design + colour from any picker (strip, Designs panel, phone strip). */
export function useApplyDesign() {
  const { updateState } = useStudio();
  return (theme: ThemeTokens) => updateState({ template: theme.design, theme: theme.id, accent: "" });
}

/**
 * Every design × colour as real mini cards in a carousel: arrow buttons page
 * through on desktop, a swipe pages on touch, and the row snaps to whole cards.
 * No scrollbar; the arrows hide at either end.
 */
export function DesignStrip({ thumbWidth = 54, className }: { thumbWidth?: number; className?: string }) {
  const { state, monthly } = useStudio();
  const thumbState = useThumbState(state);
  const apply = useApplyDesign();
  const active = resolveTheme(state.template, state.theme).id;
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = Math.abs(el.scrollLeft);
    setEdge({ start: x <= 2, end: x >= max - 2 });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    // Re-measure when the strip resizes (older browsers just measure on scroll).
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bring the chosen design into view (e.g. after picking it in the Designs panel).
  useEffect(() => {
    track.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1) => {
    const hidden = dir === -1 ? edge.start : edge.end;
    const Icon = dir === -1 ? ChevronLeftIcon : ChevronRightIcon;
    return (
      <button
        type="button"
        aria-label={dir === -1 ? "Previous designs" : "More designs"}
        onClick={() => page(dir)}
        tabIndex={hidden ? -1 : 0}
        className={cn(
          "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-card text-foreground shadow-md transition-[opacity,transform] hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring sm:grid",
          dir === -1 ? "left-1" : "right-1",
          hidden && "pointer-events-none opacity-0",
        )}
      >
        <Icon className="size-5" />
      </button>
    );
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      {arrow(-1)}
      <div
        ref={track}
        role="listbox"
        aria-label="Designs"
        onScroll={measure}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-2 items-center gap-3 overflow-x-auto overscroll-x-contain px-2 py-2"
        style={{
          maskImage: `linear-gradient(90deg, ${edge.start ? "#000" : "transparent"}, #000 48px, #000 calc(100% - 48px), ${edge.end ? "#000" : "transparent"})`,
        }}
      >
        {DESIGNS.flatMap((d) => THEMES.filter((t) => t.design === d.id)).map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={on}
              title={`${designById(t.design).name} · ${t.name}`}
              onClick={() => apply(t)}
              className={cn(
                "shrink-0 cursor-pointer snap-start rounded-[9px] outline-2 outline-offset-2 transition-[outline-color,transform] hover:-translate-y-0.5 focus-visible:outline-ring",
                on ? "outline-primary" : "outline-transparent",
              )}
            >
              <span className="block overflow-hidden rounded-[9px] shadow-sm">
                {monthly ? (
                  <DesignThumb design={t.design} theme={t} monthly={monthly} state={thumbState} width={thumbWidth} />
                ) : (
                  <span className="block" style={{ width: thumbWidth, height: thumbWidth * (CARD_H / CARD_W), background: `linear-gradient(180deg, ${t.sky[0]}, ${t.sky[2]})` }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
      {arrow(1)}
    </div>
  );
}
