import type { Lang } from "./i18n";

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
  template: string;
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
  template: "daily-classic",
  lang: "en",
  hour12: true,
  numerals: "en",
  theme: "emerald",
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
const BOOLEAN_KEYS = new Set(["hour12", "showQibla"]);
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
