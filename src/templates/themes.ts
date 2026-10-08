/** The three card designs. Every design renders every format (daily / monthly / year). */
export type DesignId = "mihrab" | "parchment" | "daylight";

/**
 * One colour variation of a design. The flat `bg/fg/accent/muted` tokens are
 * what shared pieces (DecorLayer's photo scrim and glow, the year grid) read;
 * `sky` is the design's own three-stop backdrop (night sky for Mihrab, paper
 * tones for Parchment, the daylight sky for Daylight).
 */
export type ThemeTokens = {
  id: string;
  name: string;
  design: DesignId;
  /** Main surface colour. */
  bg: string;
  /** Text colour on `bg`. */
  fg: string;
  /** The design's signature colour (gold, terracotta, emerald…). */
  accent: string;
  /** A soft tint for stripes and secondary text. */
  muted: string;
  /** Backdrop stops: [top/highlight, middle, bottom/deep]. */
  sky: [string, string, string];
  fontDisplay: string;
};

const SERIF = "var(--font-serif)";
const SANS = "var(--font-latin)";

export const THEMES: ThemeTokens[] = [
  // ---- Mihrab Night: night sky + gold arch ----
  {
    id: "mihrab-navy",
    name: "Navy & Gold",
    design: "mihrab",
    bg: "#0e1d3d",
    fg: "#f3e9d2",
    accent: "#e8c977",
    muted: "#c9b27a",
    sky: ["#1d3a6b", "#0e1d3d", "#070f24"],
    fontDisplay: SERIF,
  },
  {
    id: "mihrab-emerald",
    name: "Emerald & Gold",
    design: "mihrab",
    bg: "#0c3326",
    fg: "#f1ead2",
    accent: "#e8c977",
    muted: "#c9b27a",
    sky: ["#1a5a45", "#0c3326", "#061c15"],
    fontDisplay: SERIF,
  },
  {
    id: "mihrab-maroon",
    name: "Maroon & Gold",
    design: "mihrab",
    bg: "#3d0e17",
    fg: "#f6e6d6",
    accent: "#e8c977",
    muted: "#d1ae86",
    sky: ["#6b1d2a", "#3d0e17", "#1f060b"],
    fontDisplay: SERIF,
  },
  {
    id: "mihrab-black",
    name: "Black & Gold",
    design: "mihrab",
    bg: "#121212",
    fg: "#f1ead8",
    accent: "#e8c977",
    muted: "#b8a57a",
    sky: ["#2a2a2a", "#121212", "#050505"],
    fontDisplay: SERIF,
  },

  // ---- Parchment & Ink: printed almanac ----
  {
    id: "parchment-terracotta",
    name: "Terracotta",
    design: "parchment",
    bg: "#f3ead6",
    fg: "#2b2118",
    accent: "#a3482a",
    muted: "#7a6650",
    sky: ["#fffaee", "#f3ead6", "#e9dcc0"],
    fontDisplay: SERIF,
  },
  {
    id: "parchment-forest",
    name: "Forest Green",
    design: "parchment",
    bg: "#f1ecda",
    fg: "#1f2a1f",
    accent: "#2f5e3a",
    muted: "#6a6a52",
    sky: ["#fbf8ec", "#f1ecda", "#e3dcc2"],
    fontDisplay: SERIF,
  },
  {
    id: "parchment-indigo",
    name: "Indigo",
    design: "parchment",
    bg: "#f2ecdf",
    fg: "#1d2238",
    accent: "#2d3f7a",
    muted: "#646277",
    sky: ["#fbf8f0", "#f2ecdf", "#e4dccb"],
    fontDisplay: SERIF,
  },

  // ---- Daylight: next-prayer hero under a daytime sky ----
  {
    id: "daylight-emerald",
    name: "Emerald",
    design: "daylight",
    bg: "#f6f8f5",
    fg: "#0f2a20",
    accent: "#0f5c45",
    muted: "#eef4f0",
    sky: ["#0f5c45", "#12795a", "#3fa07f"],
    fontDisplay: SANS,
  },
  {
    id: "daylight-dusk",
    name: "Dusk Purple",
    design: "daylight",
    bg: "#f7f5f9",
    fg: "#231a33",
    accent: "#4a2f6e",
    muted: "#f0ecf5",
    sky: ["#3b2a5c", "#5e3d7e", "#a06a9a"],
    fontDisplay: SANS,
  },
  {
    id: "daylight-ocean",
    name: "Ocean Blue",
    design: "daylight",
    bg: "#f4f7fa",
    fg: "#0d2236",
    accent: "#0d3f63",
    muted: "#e9f0f6",
    sky: ["#0d3f63", "#156591", "#4b9cc4"],
    fontDisplay: SANS,
  },
];

export function themesFor(design: DesignId): ThemeTokens[] {
  return THEMES.filter((t) => t.design === design);
}

/** The theme for `id` when it belongs to `design`, otherwise that design's first (default) colour. */
export function resolveTheme(design: DesignId, id: string | undefined): ThemeTokens {
  const options = themesFor(design);
  return options.find((t) => t.id === id) ?? options[0];
}
