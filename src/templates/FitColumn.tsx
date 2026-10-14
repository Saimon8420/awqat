import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const BOX_KEYS = new Set(["position", "inset", "top", "right", "bottom", "left", "zIndex"]);

/**
 * A card's content column that always fits its box. When the user's text,
 * Qibla, Masjid details and so on add up to more than the card's height, the
 * whole column scales down evenly (and gets a little more room to wrap)
 * instead of spilling off the card or clipping. At normal content it's 1:1.
 *
 * Pass the same style the column had before; placement goes on the outer box,
 * layout (flex, alignment, text) on the scaled inner column.
 */
export function FitColumn({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const outer: CSSProperties = {};
  const inner: CSSProperties = {};
  for (const [k, v] of Object.entries(style)) (BOX_KEYS.has(k) ? outer : inner)[k as "top"] = v as never;
  const box = useRef<HTMLDivElement>(null);
  const col = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(1);

  // Runs after every render, before paint: measure the content's natural height
  // and pick the scale that makes it fit (re-measured at the wider width).
  useLayoutEffect(() => {
    const o = box.current;
    const c = col.current;
    if (!o || !c) return;
    const H = o.clientHeight;
    if (!H) return;
    const saved = c.getAttribute("style") ?? "";
    const natural = (scale: number) => {
      c.style.transform = "none";
      c.style.width = `${100 / scale}%`;
      c.style.height = "auto";
      return c.scrollHeight;
    };
    let next = 1;
    for (let i = 0; i < 4; i++) {
      const need = natural(next);
      if (need <= H / next + 0.5) break;
      next = Math.max(0.55, next * (H / next / need) * 0.995);
    }
    c.setAttribute("style", saved);
    if (Math.abs(next - s) > 0.004) setS(next);
  });

  return (
    <div ref={box} style={{ ...outer, overflow: "visible" }}>
      <div
        ref={col}
        style={{
          ...inner,
          width: `${100 / s}%`,
          height: `${100 / s}%`,
          transform: s === 1 ? undefined : `scale(${s})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
