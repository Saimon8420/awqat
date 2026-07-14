import { useId, type CSSProperties, type FC } from "react";

/**
 * Common props every motif SVG accepts. Every motif is drawn with
 * `currentColor` (or an explicit `color` override) so it can be tinted with
 * a theme's accent color by the caller — see `DecorLayer`.
 */
export type MotifIconProps = {
  className?: string;
  color?: string;
};

function motifStyle(color?: string): CSSProperties | undefined {
  return color ? { color } : undefined;
}

/** A simple crescent moon, the most common Islamic/Ramadan decorative mark. */
export const Crescent: FC<MotifIconProps> = ({ className, color }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={motifStyle(color)}
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M63 8C40 8 21 27 21 50s19 42 42 42c8 0 15.5-2.2 21.8-6.1C68.8 90.7 51 92 37.6 78.6 24.2 65.2 24.2 43.5 37.6 30.1 47.4 20.3 61.5 17 74.4 21A41.8 41.8 0 0 0 63 8Z" />
  </svg>
);

/** A single mosque-dome silhouette with a crescent finial. */
export const Dome: FC<MotifIconProps> = ({ className, color }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={motifStyle(color)}
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M48 4l3 6a6 6 0 0 1 5 5.9v3.4c14 5.9 23.5 19 23.5 34.7H20.5c0-15.7 9.5-28.8 23.5-34.7v-3.4a6 6 0 0 1 5-5.9l3-6h-4Z" />
    <rect x="14" y="56" width="72" height="8" rx="1.5" />
    <rect x="22" y="66" width="56" height="24" rx="1.5" />
    <path d="M39 90V78a5 5 0 0 1 10 0v12h-10Z" fillOpacity="0.55" />
  </svg>
);

/** A wider mosque silhouette: central dome flanked by two slender minarets. */
export const Mosque: FC<MotifIconProps> = ({ className, color }) => (
  <svg
    viewBox="0 0 160 100"
    className={className}
    style={motifStyle(color)}
    fill="currentColor"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M80 10l2.5 5A5 5 0 0 1 87 20v3c11 5 18 15.6 18 27.5H55C55 38.6 62 28 73 23v-3a5 5 0 0 1 4.5-5L80 10Z" />
    <rect x="40" y="50" width="80" height="8" rx="1.5" />
    <rect x="48" y="58" width="64" height="26" rx="1.5" />
    <path d="M70 84V70a10 10 0 0 1 20 0v14H70Z" fillOpacity="0.5" />
    {[16, 144].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="18" r="3" />
        <rect x={cx - 2.5} y="21" width="5" height="45" />
        <rect x={cx - 6} y="66" width="12" height="18" rx="1" />
      </g>
    ))}
  </svg>
);

/** A hanging Ramadan lantern (fanoos) with a suspension chain. */
export const Lantern: FC<MotifIconProps> = ({ className, color }) => (
  <svg
    viewBox="0 0 60 100"
    className={className}
    style={motifStyle(color)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M30 2v10" />
    <path d="M22 12h16l4 8H18l4-8Z" fill="currentColor" stroke="none" />
    <path d="M16 20h28l-5 10H21l-5-10Z" />
    <path d="M16 30h28v34a14 14 0 0 1-28 0V30Z" />
    <path d="M16 38h28M16 46h28M16 54h28" />
    <path d="M30 30v40" />
    <path d="M20 70h20l-5 12h-10l-5-12Z" fill="currentColor" stroke="none" />
    <path d="M30 82v10" />
  </svg>
);

/**
 * A tileable girih-style geometric pattern (interlocking eight-pointed
 * stars). Renders a repeating `<pattern>` fill so it reads as a proper
 * lattice even at small sizes — unlike the other single-glyph motifs.
 */
export const GirihPattern: FC<MotifIconProps> = ({ className, color }) => {
  const id = useId();
  const patternId = `girih-${id}`;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={motifStyle(color)}
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width="25" height="25" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.1">
            <path d="M12.5 1l3.2 6.5 7 1-5.1 5 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-5 7-1L12.5 1Z" />
            <circle cx="0" cy="0" r="3" />
            <circle cx="25" cy="0" r="3" />
            <circle cx="0" cy="25" r="3" />
            <circle cx="25" cy="25" r="3" />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${patternId})`} />
    </svg>
  );
};

/**
 * A decorative border made of alternating small stars and crescents —
 * meant to sit along an edge as a repeating strip.
 */
export const StarBorder: FC<MotifIconProps> = ({ className, color }) => {
  const id = useId();
  const patternId = `star-border-${id}`;
  return (
    <svg
      viewBox="0 0 200 20"
      className={className}
      style={motifStyle(color)}
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M10 3l1.6 3.6L15 8l-3 2.6.8 3.9L10 12.4 6.2 14.5 7 10.6 4 8l3.4-1.4L10 3Z" />
          <path d="M32 4c-4 0-7 3.1-7 7s3 7 7 7c1.4 0 2.7-.4 3.8-1.1-2.9 1-6.1.2-8.2-2-2.1-2.2-2.1-5.6 0-7.8 2.1-2.2 5.3-3 8.2-2A6.9 6.9 0 0 0 32 4Z" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="200" height="20" fill={`url(#${patternId})`} />
    </svg>
  );
};

type OrnamentProps = MotifIconProps & { text?: string };

function CalligraphyOrnament({ className, color, text }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 260 70"
      className={className}
      style={motifStyle(color)}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 20c20-14 40-14 60 0M190 20c20-14 40-14 60 0" strokeWidth="2" strokeLinecap="round" />
      <text
        x="130"
        y="42"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="26"
        fontWeight="700"
        fontFamily="var(--font-arabic, serif)"
      >
        {text}
      </text>
      <path d="M20 58h220" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}

/** Decorative "Ramadan Kareem" calligraphy-style ornament. */
export const RamadanKareemOrnament: FC<MotifIconProps> = (props) => (
  <CalligraphyOrnament {...props} text="Ramadan Kareem" />
);

/** Decorative "Eid Mubarak" calligraphy-style ornament. */
export const EidMubarakOrnament: FC<MotifIconProps> = (props) => (
  <CalligraphyOrnament {...props} text="Eid Mubarak" />
);

/** Decorative "Bismillah" calligraphy-style ornament. */
export const BismillahOrnament: FC<MotifIconProps> = (props) => (
  <CalligraphyOrnament {...props} text="Bismillah" />
);

/**
 * A mihrab (prayer-niche) arch drawn as a hollow frame — a pointed ogee
 * arch springing from two jambs. Meant to be stretched to the card's full
 * bounds so the times sit *inside* the niche, the way a mihrab frames the
 * qibla wall. Stroke-only so it reads as an architectural outline.
 */
export const MihrabArch: FC<MotifIconProps> = ({ className, color }) => (
  <svg
    viewBox="0 0 100 140"
    className={className}
    style={motifStyle(color)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden="true"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer niche outline: up the left jamb, ogee shoulders to a point, down the right jamb. */}
    <path d="M10 138 V54 C10 34 24 22 42 14 C48 11 48 4 50 2 C52 4 52 11 58 14 C76 22 90 34 90 54 V138" />
    {/* Inner keyline, offset inward for a carved-double-arch feel. */}
    <path
      d="M17 138 V56 C17 39 29 29 45 21 C48 19 48 13 50 11 C52 13 52 19 55 21 C71 29 83 39 83 56 V138"
      strokeWidth="0.8"
      strokeOpacity="0.6"
    />
    {/* Keystone flourish at the apex. */}
    <circle cx="50" cy="8" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * A tileable zellij-style eight-point star lattice — interlocking stars and
 * cross tiles, the classic Islamic geometric field. Renders a repeating
 * `<pattern>` so it fills any size as a proper mosaic.
 */
export const ZellijPattern: FC<MotifIconProps> = ({ className, color }) => {
  const id = useId();
  const patternId = `zellij-${id}`;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={motifStyle(color)}
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            {/* Eight-point star: two overlaid squares. */}
            <path d="M20 4 L26 14 L36 20 L26 26 L20 36 L14 26 L4 20 L14 14 Z" />
            <path d="M20 8 L24.5 15.5 L32 20 L24.5 24.5 L20 32 L15.5 24.5 L8 20 L15.5 15.5 Z" />
            {/* Corner quarter-stars knit the tiles together across the seam. */}
            <path d="M0 0 L6 0 L0 6 Z" />
            <path d="M40 0 L34 0 L40 6 Z" />
            <path d="M0 40 L6 40 L0 34 Z" />
            <path d="M40 40 L34 40 L40 34 Z" />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${patternId})`} />
    </svg>
  );
};

/**
 * How a motif wants to be placed by `DecorLayer`:
 * - `feature`: one large glyph anchored in a corner, behind a soft glow.
 * - `texture`: a full-bleed repeating lattice at low opacity.
 * - `border`: a repeating strip along the top and bottom edges.
 * - `frame`: stretched to the full card bounds, framing the content.
 * - `banner`: a wide horizontal ornament near the foot of the card.
 */
export type MotifKind = "feature" | "texture" | "border" | "frame" | "banner";

export type Motif = {
  id: string;
  name: string;
  Svg: FC<MotifIconProps>;
  kind: MotifKind;
};

export const MOTIFS: Motif[] = [
  { id: "crescent", name: "Crescent Moon", Svg: Crescent, kind: "feature" },
  { id: "arch", name: "Mihrab Arch", Svg: MihrabArch, kind: "frame" },
  { id: "dome", name: "Dome", Svg: Dome, kind: "feature" },
  { id: "mosque", name: "Mosque Silhouette", Svg: Mosque, kind: "feature" },
  { id: "lantern", name: "Lantern (Fanoos)", Svg: Lantern, kind: "feature" },
  { id: "zellij", name: "Zellij Star Lattice", Svg: ZellijPattern, kind: "texture" },
  { id: "girih", name: "Girih Pattern", Svg: GirihPattern, kind: "texture" },
  { id: "star-border", name: "Star & Crescent Border", Svg: StarBorder, kind: "border" },
  { id: "ramadan-kareem", name: "Ramadan Kareem", Svg: RamadanKareemOrnament, kind: "banner" },
  { id: "eid-mubarak", name: "Eid Mubarak", Svg: EidMubarakOrnament, kind: "banner" },
  { id: "bismillah", name: "Bismillah", Svg: BismillahOrnament, kind: "banner" },
];
