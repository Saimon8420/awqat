import { memo } from "react";
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

/** Applies a design + colour from any picker (strip, Designs panel, phone strip). */
export function useApplyDesign() {
  const { updateState } = useStudio();
  return (theme: ThemeTokens) => updateState({ template: theme.design, theme: theme.id, accent: "" });
}

/**
 * Every design × colour as a row of real mini cards. Desktop puts it along the
 * bottom of the canvas; the phone puts it under the card.
 */
export function DesignStrip({ thumbWidth = 54, className }: { thumbWidth?: number; className?: string }) {
  const { state, monthly } = useStudio();
  const apply = useApplyDesign();
  const active = resolveTheme(state.template, state.theme).id;

  return (
    <div
      role="listbox"
      aria-label="Designs"
      className={cn("flex items-center gap-3 overflow-x-auto overscroll-x-contain py-2", className)}
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
              "shrink-0 rounded-[9px] outline-2 outline-offset-2 transition-[outline-color,transform] hover:-translate-y-0.5 focus-visible:outline-ring",
              on ? "outline-primary" : "outline-transparent",
            )}
          >
            <span className="block overflow-hidden rounded-[9px] shadow-sm">
              {monthly ? (
                <DesignThumb design={t.design} theme={t} monthly={monthly} state={state} width={thumbWidth} />
              ) : (
                <span
                  className="block"
                  style={{
                    width: thumbWidth,
                    height: thumbWidth * (CARD_H / CARD_W),
                    background: `linear-gradient(180deg, ${t.sky[0]}, ${t.sky[2]})`,
                  }}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
