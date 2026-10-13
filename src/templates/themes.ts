/** The card designs. Every design renders every format (daily / monthly / year). */
export type DesignId =
  | "mihrab"
  | "parchment"
  | "daylight"
  | "alhambra"
  | "lantern"
  | "minimal"
  | "desert"
  | "sixtydome"
  | "kiswa"
  | "crescent";

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
  /** Extra illustration colours some designs need (dunes, brick, lantern glow…). */
  art?: string[];
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

  // ---- Alhambra: Andalusian arcade over sand. sky = [arch light, deep, gold] ----
  {
    id: "alhambra-turquoise",
    name: "Turquoise & Sand",
    design: "alhambra",
    bg: "#f3ead6",
    fg: "#2c2416",
    accent: "#0f5c63",
    muted: "#e9dcc0",
    sky: ["#fdf6e4", "#0f5c63", "#c79a3c"],
    fontDisplay: SERIF,
  },
  {
    id: "alhambra-rose",
    name: "Rose Garden",
    design: "alhambra",
    bg: "#f6e7e1",
    fg: "#3a1f1c",
    accent: "#8a3346",
    muted: "#eed6cd",
    sky: ["#fff4ee", "#8a3346", "#c79a3c"],
    fontDisplay: SERIF,
  },
  {
    id: "alhambra-olive",
    name: "Olive Court",
    design: "alhambra",
    bg: "#eeebd8",
    fg: "#272818",
    accent: "#4f5a24",
    muted: "#e0dcc0",
    sky: ["#fbf8e8", "#4f5a24", "#b88a34"],
    fontDisplay: SERIF,
  },

  // ---- Lantern Night: hanging fanous over a glowing night. sky = [glow, mid, deep] ----
  {
    id: "lantern-plum",
    name: "Plum & Amber",
    design: "lantern",
    bg: "#3a1340",
    fg: "#fbeedd",
    accent: "#f5b544",
    muted: "#4a1d50",
    sky: ["#7a2a56", "#3a1340", "#1a0720"],
    fontDisplay: SERIF,
  },
  {
    id: "lantern-teal",
    name: "Midnight Teal",
    design: "lantern",
    bg: "#0c3540",
    fg: "#f0f6ee",
    accent: "#f3c45a",
    muted: "#14444f",
    sky: ["#1f6f73", "#0c3540", "#051a20"],
    fontDisplay: SERIF,
  },
  {
    id: "lantern-ember",
    name: "Ember",
    design: "lantern",
    bg: "#3b160c",
    fg: "#fff0e0",
    accent: "#ffbf5e",
    muted: "#4c2214",
    sky: ["#8a3517", "#3b160c", "#170704"],
    fontDisplay: SERIF,
  },

  // ---- Modern Minimal: no ornament, the next prayer as one huge number ----
  {
    id: "minimal-ivory",
    name: "Ivory & Emerald",
    design: "minimal",
    bg: "#f7f5ef",
    fg: "#14130f",
    accent: "#0e7a55",
    muted: "#ece9df",
    sky: ["#f7f5ef", "#f7f5ef", "#e9e5d9"],
    fontDisplay: SANS,
  },
  {
    id: "minimal-charcoal",
    name: "Charcoal & Lime",
    design: "minimal",
    bg: "#151714",
    fg: "#f1f3ec",
    accent: "#b6e05a",
    muted: "#222520",
    sky: ["#151714", "#151714", "#0c0d0b"],
    fontDisplay: SANS,
  },
  {
    id: "minimal-sky",
    name: "Sky & Coral",
    design: "minimal",
    bg: "#e9f1f7",
    fg: "#0f1d2b",
    accent: "#e8553e",
    muted: "#dbe7f0",
    sky: ["#e9f1f7", "#e9f1f7", "#d5e3ee"],
    fontDisplay: SANS,
  },

  // ---- Desert Dusk: caravan over dunes at sunset. sky = gradient; art = [sun, dune near, dune mid, silhouette] ----
  {
    id: "desert-sunset",
    name: "Sunset",
    design: "desert",
    bg: "#fbf3ee",
    fg: "#2a1418",
    accent: "#c24a33",
    muted: "#f4e3da",
    sky: ["#f6a65a", "#e8714a", "#7a2f4a"],
    fontDisplay: SERIF,
    art: ["#ffe2a6", "#c8593e", "#8f3a3c", "#3a1626"],
  },
  {
    id: "desert-twilight",
    name: "Twilight",
    design: "desert",
    bg: "#f5f2fa",
    fg: "#1d1830",
    accent: "#6a4aa0",
    muted: "#e8e2f2",
    sky: ["#8aa8e0", "#b77fb0", "#3a2a5e"],
    fontDisplay: SERIF,
    art: ["#ffe9c2", "#8a5f9c", "#5a3f78", "#21183a"],
  },
  {
    id: "desert-golden",
    name: "Golden Hour",
    design: "desert",
    bg: "#fcf6ec",
    fg: "#2c1a0c",
    accent: "#b8621f",
    muted: "#f5e6cf",
    sky: ["#ffd98a", "#f1a94a", "#a8572a"],
    fontDisplay: SERIF,
    art: ["#fff4d0", "#d48a3a", "#a9612a", "#4a2410"],
  },

  // ---- Sixty Dome: Bagerhat's Shait Gumbad mosque in brick. art = [brick, dark brick, sky] ----
  {
    id: "sixtydome-terracotta",
    name: "Terracotta",
    design: "sixtydome",
    bg: "#f7ecdf",
    fg: "#2c1810",
    accent: "#b5532f",
    muted: "#f0dfcc",
    sky: ["#f2d9bd", "#f7ecdf", "#6e2c17"],
    fontDisplay: SERIF,
    art: ["#b5532f", "#6e2c17", "#f2d9bd"],
  },
  {
    id: "sixtydome-monsoon",
    name: "Monsoon Green",
    design: "sixtydome",
    bg: "#eef2e8",
    fg: "#17241a",
    accent: "#2f6b4a",
    muted: "#dde6d6",
    sky: ["#d5e3cf", "#eef2e8", "#183d2a"],
    fontDisplay: SERIF,
    art: ["#2f6b4a", "#183d2a", "#d5e3cf"],
  },
  {
    id: "sixtydome-rose",
    name: "Evening Rose",
    design: "sixtydome",
    bg: "#f7e9e6",
    fg: "#2c1418",
    accent: "#a33a4c",
    muted: "#efd8d4",
    sky: ["#f0cfd0", "#f7e9e6", "#5e1c28"],
    fontDisplay: SERIF,
    art: ["#a33a4c", "#5e1c28", "#f0cfd0"],
  },

  // ---- Kiswa Gold: woven cover crossed by a gold calligraphy belt. sky = [belt, bg, belt edge] ----
  {
    id: "kiswa-black",
    name: "Black & Gold",
    design: "kiswa",
    bg: "#0d0d0d",
    fg: "#f3ecd9",
    accent: "#d9b25f",
    muted: "#1a1a1a",
    sky: ["#1a1a1a", "#0d0d0d", "#050505"],
    fontDisplay: SERIF,
  },
  {
    id: "kiswa-green",
    name: "Green & Gold",
    design: "kiswa",
    bg: "#0b2a20",
    fg: "#f1ead2",
    accent: "#d9b25f",
    muted: "#0f382b",
    sky: ["#0f382b", "#0b2a20", "#061810"],
    fontDisplay: SERIF,
  },
  {
    id: "kiswa-burgundy",
    name: "Burgundy & Gold",
    design: "kiswa",
    bg: "#2a0b12",
    fg: "#f6e6d6",
    accent: "#e0b866",
    muted: "#3a101a",
    sky: ["#3a101a", "#2a0b12", "#16050a"],
    fontDisplay: SERIF,
  },

  // ---- Crescent Skyline: crescent and stars over domes and minarets ----
  {
    id: "crescent-indigo",
    name: "Indigo Night",
    design: "crescent",
    bg: "#0d1030",
    fg: "#ffffff",
    accent: "#f5d47a",
    muted: "#1a1f4a",
    sky: ["#26306b", "#1a1f4a", "#0d1030"],
    fontDisplay: SANS,
  },
  {
    id: "crescent-teal",
    name: "Teal Dusk",
    design: "crescent",
    bg: "#0a252c",
    fg: "#ffffff",
    accent: "#f3e3a2",
    muted: "#144650",
    sky: ["#1f6a74", "#144650", "#0a252c"],
    fontDisplay: SANS,
  },
  {
    id: "crescent-rose",
    name: "Rose Dawn",
    design: "crescent",
    bg: "#2a1730",
    fg: "#ffffff",
    accent: "#ffe0b0",
    muted: "#4a2a50",
    sky: ["#c56a7c", "#6a3a6a", "#2a1730"],
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
