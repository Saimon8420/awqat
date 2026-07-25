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

/** Append an 8-bit alpha channel to a 6-digit hex, or fall back to a
 * translucent white for any other color format. Used for the accent glow. */
function hexAlpha(color: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${a}` : `rgba(255,255,255,${alpha})`;
}

// Fine, uniformly-tiled geometric lattices as CSS `background-image` data
// URIs. Unlike an inline `<pattern>`-filled SVG (which scales its whole
// viewBox to fit the element and so stretches into a few big glyphs on a tall
// card), a data URI tiled at a fixed `background-size` stays a crisp,
// consistent mosaic at any card dimension.
type TileKey = "girih" | "zellij" | "muqarnas" | "arabesque";

const TILE: Record<TileKey, { size: number; svg: (c: string) => string }> = {
  girih: {
    size: 50,
    svg: (c) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><g fill='none' stroke='${c}' stroke-width='1.2'><path d='M25 3 L31 13 L43 13 L37 25 L43 37 L31 37 L25 47 L19 37 L7 37 L13 25 L7 13 L19 13 Z'/><circle cx='25' cy='25' r='4'/></g></svg>`,
  },
  zellij: {
    size: 44,
    svg: (c) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><g fill='none' stroke='${c}' stroke-width='1'><path d='M22 3 L27 17 L41 22 L27 27 L22 41 L17 27 L3 22 L17 17 Z'/><path d='M0 0 L6 0 L0 6 Z M44 0 L38 0 L44 6 Z M0 44 L6 44 L0 38 Z M44 44 L38 44 L44 38 Z'/></g></svg>`,
  },
  muqarnas: {
    size: 26,
    svg: (c) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><g fill='none' stroke='${c}' stroke-width='1.1'><path d='M3 25 V12 Q13 2 23 12 V25'/></g></svg>`,
  },
  arabesque: {
    size: 42,
    svg: (c) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'><g fill='none' stroke='${c}' stroke-width='1.1' stroke-linecap='round'><path d='M0 21 C8 8 17 8 21 21 C25 34 34 34 42 21'/><path d='M11 15 q4 -6 8 -1'/><path d='M23 27 q4 6 8 1'/></g></svg>`,
  },
};

function tileStyle(kind: TileKey, color: string, opacity: number): CSSProperties {
  const t = TILE[kind];
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(t.svg(color))}")`,
    backgroundSize: `${t.size}px ${t.size}px`,
    opacity,
  };
}

/**
 * The decorative background layer for prayer-card/poster templates. Builds an
 * ornate, mosque-craft backdrop from `state.gradient` / `state.bgImage` /
 * `state.motif`:
 *
 *  1. a layered gradient (or uploaded photo behind a legibility scrim),
 *  2. a faint full-bleed girih tile texture + a soft accent glow for depth
 *     (only over a gradient backdrop, so the field reads as a carved panel
 *     rather than a flat wash),
 *  3. an inset keyline that frames the card like a printed plate,
 *  4. the chosen motif, placed by its `kind` — a large glowing corner
 *     `feature`, a full-bleed `texture` lattice, edge `border` strips, a
 *     stretched mihrab `frame`, or a foot `banner`.
 *
 * Renders `null` when none of gradient/photo/motif is set, so dropping it into
 * a template is a visual no-op by default. Must sit inside a `position:
 * relative` ancestor that forms a stacking context (templates set `isolation:
 * isolate`) — it uses a negative `z-index` to paint behind normal-flow content
 * regardless of DOM order. It's part of the template DOM (not app chrome) so
 * the export pipeline captures it, and `pointer-events: none` so it never
 * steals clicks from the editor above.
 */
export function DecorLayer({ state, theme, accent }: DecorLayerProps) {
  const gradient = state.gradient ? GRADIENTS.find((g) => g.id === state.gradient) : undefined;
  const motif = state.motif ? MOTIFS.find((m) => m.id === state.motif) : undefined;
  const hasPhoto = Boolean(state.bgImage);
  // Photo wins over a gradient — that's what a user expects right after
  // uploading one. (The Background picker also keeps the two mutually
  // exclusive in state, so in practice only one is ever set.)
  const showGradient = Boolean(gradient) && !hasPhoto;
  // The user's custom accent wins when set; otherwise fall back to the
  // current theme's accent — same precedence templates use for everything
  // else they tint with the effective accent.
  const effectiveAccent = accent || state.accent || theme.accent;
  const hasBackdrop = showGradient || hasPhoto;

  if (!showGradient && !hasPhoto && !motif) return null;

  return (
    <div className="pointer-events-none" style={LAYER_STYLE} aria-hidden="true">
      {/* 1. Base field */}
      {hasPhoto ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${state.bgImage}")`,
              filter: `blur(${state.bgBlur ?? 0}px)`,
            }}
          />
          {/* Legibility scrim so text stays readable over a photo backdrop. */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: theme.bg, opacity: (state.bgDim ?? 55) / 100 }}
          />
        </>
      ) : showGradient ? (
        <div className="absolute inset-0" style={{ backgroundImage: gradient!.css }} />
      ) : null}

      {/* 2. Depth over a designed backdrop: a whisper of carved-tile texture
          and a soft accent glow, so the field reads as a lit panel rather
          than a flat wash. (Gradient only — a photo already has its scrim.) */}
      {showGradient ? (
        <>
          <div className="absolute inset-0" style={tileStyle("girih", effectiveAccent, 0.1)} />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(120% 80% at 50% -10%, ${hexAlpha(
                effectiveAccent,
                0.28,
              )} 0%, transparent 60%)`,
            }}
          />
        </>
      ) : null}

      {/* 3. Inset keyline frame for a printed-plate edge (backdrops only). */}
      {hasBackdrop ? (
        <div
          className="absolute inset-4 rounded-[inherit]"
          style={{ border: `1px solid ${hexAlpha(effectiveAccent, 0.35)}` }}
        />
      ) : null}

      {/* 4. Motif, placed by kind. */}
      {motif ? <MotifDecor motif={motif} accent={effectiveAccent} /> : null}
    </div>
  );
}

function MotifDecor({
  motif,
  accent,
}: {
  motif: (typeof MOTIFS)[number];
  accent: string;
}) {
  const { Svg, kind } = motif;

  if (kind === "texture") {
    // Texture motifs render via the fixed-size CSS tile engine (not their own
    // <pattern> SVG), so map the motif id to its tile; unknown ids fall back
    // to the girih lattice.
    const k: TileKey =
      motif.id === "zellij" || motif.id === "muqarnas" || motif.id === "arabesque"
        ? motif.id
        : "girih";
    return <div className="absolute inset-0" style={tileStyle(k, accent, 0.16)} />;
  }

  if (kind === "frame") {
    return (
      <div className="absolute inset-6" style={{ opacity: 0.5 }}>
        <Svg className="h-full w-full" color={accent} />
      </div>
    );
  }

  if (kind === "border") {
    return (
      <>
        <div className="absolute inset-x-6 top-5 h-5" style={{ opacity: 0.55 }}>
          <Svg className="h-full w-full" color={accent} />
        </div>
        <div className="absolute inset-x-6 bottom-5 h-5" style={{ opacity: 0.55 }}>
          <Svg className="h-full w-full" color={accent} />
        </div>
      </>
    );
  }

  if (kind === "banner") {
    return (
      <div className="absolute inset-x-0 bottom-10 flex justify-center" style={{ opacity: 0.4 }}>
        <div className="w-3/4 max-w-[70%]">
          <Svg className="h-full w-full" color={accent} />
        </div>
      </div>
    );
  }

  // feature: a large glyph in the lower-right, lifted off the field by a soft
  // radial glow of the accent so it glows rather than sits flat.
  return (
    <>
      <div
        className="absolute -bottom-[8%] -right-[8%] h-2/3 w-2/3"
        style={{
          backgroundImage: `radial-gradient(circle at 60% 40%, ${hexAlpha(
            accent,
            0.45,
          )} 0%, transparent 65%)`,
        }}
      />
      <div className="absolute -bottom-[4%] -right-[4%] h-[46%] w-[46%]" style={{ opacity: 0.22 }}>
        <Svg className="h-full w-full" color={accent} />
      </div>
    </>
  );
}

export default DecorLayer;
