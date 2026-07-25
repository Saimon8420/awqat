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
  // Heritage palettes — named after holy sites / historic centres as colour
  // inspiration only (the Kiswah's black-and-gold, Madinah's green dome,
  // the Dome of the Rock's teal-and-gold, Makkah's marble, Andalusi
  // terracotta, Iznik cobalt, Samarkand blue, desert sand).
  {
    id: "kaaba",
    name: "Kaaba",
    bg: "#0b0b0d",
    fg: "#efe6cf",
    accent: "#c9a227",
    muted: "#1c1a16",
    fontDisplay: "var(--font-arabic)",
  },
  {
    id: "nabawi",
    name: "Nabawi",
    bg: "#0c3b2e",
    fg: "#f3ecd8",
    accent: "#d9b44a",
    muted: "#12513e",
    fontDisplay: "var(--font-arabic)",
  },
  {
    id: "aqsa",
    name: "Aqsa",
    bg: "#0a3a46",
    fg: "#eaf3f2",
    accent: "#e2b64c",
    muted: "#10505f",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "haram",
    name: "Haram",
    bg: "#f6f2ea",
    fg: "#2a2118",
    accent: "#b9922e",
    muted: "#e7ddca",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "andalus",
    name: "Andalus",
    bg: "#2b1410",
    fg: "#f6e7d4",
    accent: "#d97843",
    muted: "#4a271d",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "iznik",
    name: "Iznik",
    bg: "#f3f6fb",
    fg: "#12315e",
    accent: "#1f7a8c",
    muted: "#dbe6f2",
    fontDisplay: "var(--font-latin)",
  },
  {
    id: "samarkand",
    name: "Samarkand",
    bg: "#0e2a6b",
    fg: "#eaf0ff",
    accent: "#2bb3c0",
    muted: "#173a8f",
    fontDisplay: "var(--font-arabic)",
  },
  {
    id: "sahara",
    name: "Sahara",
    bg: "#f4ead6",
    fg: "#3a2a17",
    accent: "#b5701f",
    muted: "#e6d6b8",
    fontDisplay: "var(--font-latin)",
  },
];
