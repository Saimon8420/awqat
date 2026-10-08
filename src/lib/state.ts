import type { Lang } from "./i18n";
import type { DesignId } from "@/templates/themes";
import { resolveTheme } from "@/templates/themes";

export type StudioState = {
  lat: number;
  lon: number;
  city: string;
  method?: string;
  madhab?: string;
  year: number;
  /** 1-12 (January = 1). Drives which month is fetched/previewed. */
  month: number;
  /** 1-31. Used by daily-format templates to pick a specific day within `month`. */
  day: number;
  format: "daily" | "monthly" | "year";
  /** The card design (see `DESIGNS` in templates/registry). Same design across all three formats. */
  template: DesignId;
  /** Masjid mode: the card carries the organization's logo / name / address. */
  masjid: boolean;
  /** Ramadan mode: Sehri & Iftar lead, and Ramadan's special nights are highlighted. */
  ramadan: boolean;
  /** "Show on card" toggles. */
  showFasting: boolean;
  showArabic: boolean;
  showNext: boolean;
  lang: Lang;
  hour12: boolean;
  numerals: Lang;
  theme: string;
  accent: string;
  bgImage?: string;
  /** Selected `MOTIFS` id (see `src/graphics/index.tsx`), or unset for none. */
  motif?: string;
  /** Selected `GRADIENTS` id (see `src/graphics/backgrounds.ts`), or unset for none. */
  gradient?: string;
  /** Photo background scrim opacity, 0-100 (%). Unset falls back to the effective default of 55. */
  bgDim?: number;
  /** Photo background blur, 0-20 (px). Unset falls back to the effective default of 0 (no blur). */
  bgBlur?: number;
  /** Card corner radius, 0-48 (px). Unset keeps each template's own default rounded look. */
  radius?: number;
  showRows: Record<string, boolean>;
  org?: { name?: string; address?: string; tagline?: string; logo?: string };
  personal?: { greeting?: string; dua?: string };
  showQibla: boolean;
  /**
   * Export aspect ratio for the `daily` format's `#export-node` canvas (see
   * `ExportBar`/`PreviewStage`, Task 16). Ignored by `monthly` (portrait) and
   * `year` (A3 landscape), which always use their own fixed canvas size.
   */
  exportRatio?: "story" | "square" | "post";
  /**
   * Page orientation for the `monthly` format — drives both the live preview
   * canvas shape and the exported PDF/PNG. `daily` derives orientation from
   * `exportRatio` and `year` is always landscape, so this only applies to
   * `monthly`. Unset falls back to `portrait`.
   */
  orientation?: "portrait" | "landscape";
};

export const DEFAULT_STATE: StudioState = {
  lat: 23.81,
  lon: 90.41,
  city: "Dhaka",
  method: "MuslimWorldLeague",
  madhab: "shafi",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  format: "daily",
  template: "mihrab",
  masjid: false,
  ramadan: false,
  showFasting: true,
  showArabic: true,
  showNext: true,
  lang: "en",
  hour12: true,
  numerals: "en",
  theme: "mihrab-navy",
  accent: "",
  showRows: {
    fajr: true,
    sunrise: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  showQibla: false,
  exportRatio: "story",
};

const STORAGE_KEY = "awqat:state";

// Fields serialized to the URL query string. bgImage and org.logo are
// excluded intentionally — they can be large data URIs and only persist
// via localStorage (see saveLocal/loadLocal).
const SCALAR_KEYS = [
  "lat",
  "lon",
  "city",
  "method",
  "madhab",
  "year",
  "month",
  "day",
  "format",
  "template",
  "masjid",
  "ramadan",
  "showFasting",
  "showArabic",
  "showNext",
  "lang",
  "hour12",
  "numerals",
  "theme",
  "accent",
  "motif",
  "gradient",
  "bgDim",
  "bgBlur",
  "radius",
  "showQibla",
  "exportRatio",
  "orientation",
] as const;

const NUMBER_KEYS = new Set(["lat", "lon", "year", "month", "day", "bgDim", "bgBlur", "radius"]);
const BOOLEAN_KEYS = new Set([
  "hour12",
  "showQibla",
  "masjid",
  "ramadan",
  "showFasting",
  "showArabic",
  "showNext",
]);
const FORMAT_VALUES = new Set(["daily", "monthly", "year"]);
const LANG_VALUES = new Set(["en", "bn", "ar"]);
const ORIENTATION_VALUES = new Set(["portrait", "landscape"]);

export function encodeState(s: StudioState): string {
  const params = new URLSearchParams();
  for (const key of SCALAR_KEYS) {
    const value = s[key];
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function decodeState(query: string): Partial<StudioState> {
  const params = new URLSearchParams(query);
  const result: Record<string, unknown> = {};

  for (const key of SCALAR_KEYS) {
    if (!params.has(key)) continue;
    const raw = params.get(key) as string;
    if (NUMBER_KEYS.has(key)) {
      const num = Number(raw);
      if (!Number.isFinite(num)) continue; // malformed (e.g. "abc") — ignore rather than propagate NaN
      result[key] = num;
    } else if (BOOLEAN_KEYS.has(key)) {
      result[key] = raw === "true";
    } else if (key === "format") {
      if (!FORMAT_VALUES.has(raw)) continue; // e.g. "bogus" — ignore rather than propagate an invalid format
      result[key] = raw;
    } else if (key === "lang" || key === "numerals") {
      if (!LANG_VALUES.has(raw)) continue;
      result[key] = raw;
    } else if (key === "orientation") {
      if (!ORIENTATION_VALUES.has(raw)) continue;
      result[key] = raw;
    } else {
      result[key] = raw;
    }
  }

  return result as Partial<StudioState>;
}

const DESIGN_IDS = new Set<string>(["mihrab", "parchment", "daylight"]);

/**
 * Before the redesign each format had its own templates ("daily-classic",
 * "monthly-masjid", "monthly-ramadan"…) and the colour themes were shared.
 * Links and saved settings from then still carry those ids, so they're mapped
 * onto the new model: the matching design plus the Masjid / Ramadan switch.
 */
const LEGACY_TEMPLATES: Record<string, Partial<StudioState>> = {
  "daily-classic": { template: "mihrab" },
  "monthly-classic": { template: "mihrab" },
  "year-overview": { template: "mihrab" },
  "daily-org": { template: "mihrab", masjid: true },
  "monthly-masjid": { template: "mihrab", masjid: true },
  "year-org": { template: "mihrab", masjid: true },
  "monthly-ramadan": { template: "mihrab", ramadan: true },
};

/** Normalizes a merged state: maps legacy template ids and keeps `theme` valid for the design. */
export function migrateState(s: StudioState): StudioState {
  let next = s;
  const raw = s.template as string;
  if (!DESIGN_IDS.has(raw)) {
    next = { ...next, template: "mihrab", ...(LEGACY_TEMPLATES[raw] ?? {}) };
  }
  // Fill switches that older saved states never had.
  next = {
    ...next,
    masjid: next.masjid ?? false,
    ramadan: next.ramadan ?? false,
    showFasting: next.showFasting ?? true,
    showArabic: next.showArabic ?? true,
    showNext: next.showNext ?? true,
  };
  const theme = resolveTheme(next.template, next.theme).id;
  return theme === next.theme ? next : { ...next, theme };
}

export function saveLocal(s: StudioState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function loadLocal(): StudioState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudioState;
  } catch {
    return null;
  }
}
