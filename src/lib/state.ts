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
  showRows: Record<string, boolean>;
  org?: { name?: string; address?: string; tagline?: string; logo?: string };
  personal?: { greeting?: string; dua?: string };
  showQibla: boolean;
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
  template: "classic",
  lang: "en",
  hour12: true,
  numerals: "en",
  theme: "emerald",
  accent: "emerald",
  showRows: {
    fajr: true,
    sunrise: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  showQibla: false,
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
  "showQibla",
] as const;

const NUMBER_KEYS = new Set(["lat", "lon", "year", "month", "day"]);
const BOOLEAN_KEYS = new Set(["hour12", "showQibla"]);

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
      result[key] = Number(raw);
    } else if (BOOLEAN_KEYS.has(key)) {
      result[key] = raw === "true";
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
