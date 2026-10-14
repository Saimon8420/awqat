import type { CSSProperties } from "react";
import type { StudioState } from "./state";

const ZWSP = "\u200b";

/**
 * Lets text with very long unbroken runs ("aaaaaaaa…", a pasted URL) wrap
 * instead of running off the card, by adding invisible break points inside
 * any run longer than `max` characters. Normal words are left alone.
 */
export function breakable(text: string | undefined, max = 16): string | undefined {
  if (!text) return text;
  return text.replace(new RegExp(String.raw`\S{${max + 1},}`, "gu"), (run) => {
    const chars = Array.from(run);
    let out = "";
    for (let i = 0; i < chars.length; i++) out += (i && i % max === 0 ? ZWSP : "") + chars[i];
    return out;
  });
}

/** The state as cards render it: the user's own words made safe to wrap. */
export function cardState(s: StudioState): StudioState {
  const org = s.org && { ...s.org, name: breakable(s.org.name), address: breakable(s.org.address), tagline: breakable(s.org.tagline) };
  const personal = s.personal && { greeting: breakable(s.personal.greeting), dua: breakable(s.personal.dua) };
  return { ...s, org, personal };
}

/**
 * Style for user text in a fixed space: the font shrinks as the text grows
 * past `fits` characters (down to 70%), and anything still too long is cut
 * at `lines` lines with an ellipsis, so the card never overflows.
 */
export function fitText(text: string | undefined, size: number, lines: number, fits = 40): CSSProperties {
  const n = Array.from(text ?? "").filter((c) => c !== ZWSP).length;
  const scale = n <= fits ? 1 : Math.max(0.7, Math.sqrt(fits / n));
  return {
    fontSize: size * scale,
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
    // Clamping hides overflow, so give each line room for descenders (g, j, p, y)
    // and italic overhang, or their tails get cut off.
    lineHeight: 1.4,
    paddingBlock: "0.1em",
    paddingInline: "0.15em",
    // Hidden overflow lets a flex column squash the box to nothing; keep its full height.
    flexShrink: 0,
  };
}
