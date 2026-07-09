/**
 * CSS `background-image` presets a user can pick as a card/poster backdrop
 * (see `DecorLayer`). Each entry is a ready-to-use CSS gradient string —
 * linear or radial — tuned to stay tasteful behind text (soft, low-contrast
 * transitions rather than saturated stripes).
 */
export type Gradient = {
  id: string;
  name: string;
  css: string;
};

export const GRADIENTS: Gradient[] = [
  {
    id: "twilight",
    name: "Twilight",
    css: "linear-gradient(160deg, #0b1440 0%, #1c2a63 45%, #2a1128 100%)",
  },
  {
    id: "emerald-glow",
    name: "Emerald Glow",
    css: "radial-gradient(circle at 25% 20%, #16543a 0%, #0b3d2e 45%, #04150f 100%)",
  },
  {
    id: "sunset-sky",
    name: "Sunset Sky",
    css: "linear-gradient(135deg, #ff7849 0%, #c1477c 55%, #2a1128 100%)",
  },
  {
    id: "gold-shimmer",
    name: "Gold Shimmer",
    css: "linear-gradient(120deg, #3a2c04 0%, #7a5a10 40%, #d4af37 75%, #f6e7bd 100%)",
  },
  {
    id: "midnight-stars",
    name: "Midnight Stars",
    css: "radial-gradient(circle at 80% 10%, #1c2333 0%, #0a0e17 55%, #05070c 100%)",
  },
  {
    id: "ramadan-night",
    name: "Ramadan Night",
    css: "radial-gradient(circle at 50% 0%, #1f2f5c 0%, #0f1c3f 50%, #060b1e 100%)",
  },
  {
    id: "dawn-mist",
    name: "Dawn Mist",
    css: "linear-gradient(180deg, #f5efe0 0%, #cde9dc 60%, #a9d3c1 100%)",
  },
];
