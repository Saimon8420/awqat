import type { CSSProperties } from "react";
import type { StudioState } from "@/lib/state";
import type { ThemeTokens } from "@/templates/themes";
import { MOTIFS } from "./index";
import { GRADIENTS } from "./backgrounds";

export type DecorLayerProps = {
  state: StudioState;
  theme: ThemeTokens;
  /**
   * The effective accent color (a template's `state.accent || theme.accent`)
   * used to tint the motif watermark. Optional so existing/ad-hoc callers
   * still work; falls back to `theme.accent` when omitted.
   */
  accent?: string;
};

const LAYER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  overflow: "hidden",
};

/**
 * The decorative background layer for prayer-card/poster templates: a
 * gradient or uploaded photo behind a legibility scrim, plus an optional
 * accent-tinted Islamic motif watermark — all driven by `state.gradient`,
 * `state.bgImage`, and `state.motif`.
 *
 * Renders `null` when none of those three are set, so dropping this into a
 * template is a visual no-op by default. Must be placed inside a
 * `position: relative` ancestor (the template root) — it uses a negative
 * `z-index` so it paints behind the template's normal-flow content
 * regardless of DOM order, without requiring the content itself to opt into
 * a stacking context.
 *
 * It's rendered as part of the template DOM (not app chrome) so it's
 * captured by the export pipeline, and it's `pointer-events: none` so it
 * never captures clicks meant for the template/editor above it.
 */
export function DecorLayer({ state, theme, accent }: DecorLayerProps) {
  const gradient = state.gradient ? GRADIENTS.find((g) => g.id === state.gradient) : undefined;
  const motif = state.motif ? MOTIFS.find((m) => m.id === state.motif) : undefined;
  const hasPhoto = Boolean(state.bgImage) && !gradient;
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent — same precedence templates use for everything
  // else they tint with the effective accent.
  const effectiveAccent = accent || state.accent || theme.accent;

  if (!gradient && !hasPhoto && !motif) return null;

  return (
    <div className="pointer-events-none" style={LAYER_STYLE} aria-hidden="true">
      {gradient ? (
        <div className="absolute inset-0" style={{ backgroundImage: gradient.css }} />
      ) : hasPhoto ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${state.bgImage})` }}
          />
          {/* Legibility scrim so text stays readable over a photo backdrop. */}
          <div className="absolute inset-0" style={{ backgroundColor: theme.bg, opacity: 0.55 }} />
        </>
      ) : null}

      {motif ? (
        <div className="absolute bottom-4 right-4 h-1/3 w-1/3" style={{ opacity: 0.16 }}>
          <motif.Svg className="h-full w-full" color={effectiveAccent} />
        </div>
      ) : null}
    </div>
  );
}

export default DecorLayer;
