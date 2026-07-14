/**
 * CSS `background-image` presets a user can pick as a card/poster backdrop
 * (see `DecorLayer`). Each entry layers a soft radial "glow" over a base
 * linear/radial field, so the backdrop reads with depth — a lit sky rather
 * than a flat wash — while staying tasteful behind text. Comma-separated
 * layers paint front-to-back (the glow sits on top of the base).
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
    css: [
      "radial-gradient(120% 90% at 50% -15%, rgba(150,170,255,0.40) 0%, transparent 55%)",
      "linear-gradient(160deg, #0b1440 0%, #1c2a63 45%, #2a1128 100%)",
    ].join(", "),
  },
  {
    id: "emerald-glow",
    name: "Emerald Glow",
    css: [
      "radial-gradient(90% 70% at 22% 12%, rgba(52,220,150,0.45) 0%, transparent 55%)",
      "radial-gradient(circle at 25% 20%, #16543a 0%, #0b3d2e 45%, #04150f 100%)",
    ].join(", "),
  },
  {
    id: "sunset-sky",
    name: "Sunset Sky",
    css: [
      "radial-gradient(80% 60% at 78% 8%, rgba(255,210,140,0.55) 0%, transparent 55%)",
      "linear-gradient(155deg, #ff7849 0%, #c1477c 55%, #2a1128 100%)",
    ].join(", "),
  },
  {
    id: "gold-shimmer",
    name: "Gold Shimmer",
    css: [
      "radial-gradient(90% 60% at 70% 10%, rgba(255,240,200,0.65) 0%, transparent 50%)",
      "linear-gradient(120deg, #3a2c04 0%, #7a5a10 40%, #d4af37 75%, #f6e7bd 100%)",
    ].join(", "),
  },
  {
    id: "midnight-stars",
    name: "Midnight Stars",
    css: [
      "radial-gradient(70% 60% at 82% 8%, rgba(120,150,220,0.35) 0%, transparent 50%)",
      "radial-gradient(circle at 80% 10%, #1c2333 0%, #0a0e17 55%, #05070c 100%)",
    ].join(", "),
  },
  {
    id: "ramadan-night",
    name: "Ramadan Night",
    css: [
      "radial-gradient(90% 70% at 50% 108%, rgba(220,170,90,0.45) 0%, transparent 55%)",
      "radial-gradient(circle at 50% 0%, #1f2f5c 0%, #0f1c3f 50%, #060b1e 100%)",
    ].join(", "),
  },
  {
    id: "dawn-mist",
    name: "Dawn Mist",
    css: [
      "radial-gradient(100% 70% at 50% -10%, rgba(255,230,190,0.70) 0%, transparent 55%)",
      "linear-gradient(180deg, #f5efe0 0%, #cde9dc 60%, #a9d3c1 100%)",
    ].join(", "),
  },
];
