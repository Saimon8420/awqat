export type ThemeTokens = {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  fontDisplay: string;
};

export const THEMES: ThemeTokens[] = [
  {
    id: "emerald",
    name: "Emerald",
    bg: "#f4faf7",
    fg: "#0b3d2e",
    accent: "#0f9d63",
    muted: "#cde9dc",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "gold-navy",
    name: "Gold on Navy",
    bg: "#0b1440",
    fg: "#f6e7bd",
    accent: "#d4af37",
    muted: "#1c2a63",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#2a1128",
    fg: "#fff1e6",
    accent: "#ff7849",
    muted: "#5a2b4a",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "minimal",
    name: "Minimal White",
    bg: "#ffffff",
    fg: "#171717",
    accent: "#171717",
    muted: "#e5e5e5",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0a0e17",
    fg: "#e6ebf5",
    accent: "#5b8def",
    muted: "#1c2333",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "ramadan",
    name: "Ramadan",
    bg: "#0f1c3f",
    fg: "#f5efe0",
    accent: "#c9a24b",
    muted: "#1f2f5c",
    fontDisplay: "var(--font-arabic)",
  },
];
