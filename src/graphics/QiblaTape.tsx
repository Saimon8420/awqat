import { label, toNumerals, type Lang } from "@/lib/i18n";

/** Compass points in each language (Arabic and Bangla spelled out, Latin as letters). */
const POINTS: Record<Lang, string[]> = {
  en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  bn: ["উত্তর", "উত্তর-পূর্ব", "পূর্ব", "দক্ষিণ-পূর্ব", "দক্ষিণ", "দক্ষিণ-পশ্চিম", "পশ্চিম", "উত্তর-পশ্চিম"],
  ar: ["ش", "ش ق", "ق", "ج ق", "ج", "ج غ", "غ", "ش غ"],
};

/** Nearest of the 8 compass points for a bearing. */
export function compassPoint(bearing: number, lang: Lang): string {
  return POINTS[lang][Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

function Kaaba({ x, y, s, gold }: { x: number; y: number; s: number; gold: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-6} y={-6} width={12} height={12} rx={1} fill="#111111" />
      <rect x={-6} y={-2.6} width={12} height={2.2} fill={gold} />
      <rect x={-1.4} y={1.6} width={2.8} height={4.4} fill={gold} opacity={0.85} />
    </g>
  );
}

/**
 * The Qibla as a horizon compass tape (like a car compass): the strip is
 * centred on the Qibla bearing with the Kaaba under the pointer, and the
 * caption gives the bearing, the compass point and the distance to Makkah.
 * Colours come from the card: `accent` for the marks, `ink` for the text.
 */
export function QiblaTape({
  bearing,
  distanceKm,
  accent,
  ink,
  lang,
  numerals,
  width,
  k = 1,
}: {
  bearing: number;
  distanceKm?: number;
  accent: string;
  ink: string;
  lang: Lang;
  numerals: Lang;
  /** Card pixels wide. */
  width: number | string;
  /** The card's ratio scale. */
  k?: number;
}) {
  const b = Math.round(((bearing % 360) + 360) % 360);
  // The tape window is 120° wide; its viewBox matches the strip's shape so nothing is cropped.
  const H = 22;
  const marks = [];
  // Ticks sit on the real 5° grid so N / NE / E… land on their true bearings.
  for (let a = Math.ceil((b - 60) / 5) * 5; a <= b + 60; a += 5) {
    const deg = ((a % 360) + 360) % 360;
    const major = deg % 45 === 0;
    const x = a - b;
    if (Math.abs(x) < 4) continue; // the Kaaba sits at the centre
    marks.push(
      <line key={`l${a}`} x1={x} y1={major ? 3 : 6} x2={x} y2={major ? 13 : 10} stroke={accent} strokeOpacity={major ? 0.95 : 0.45} strokeWidth={major ? 0.9 : 0.55} />,
    );
    if (major) {
      marks.push(
        <text key={`t${a}`} x={x} y={20} textAnchor="middle" fontSize={lang === "en" ? 5 : 3.6} fontWeight={600} fill={ink} opacity={0.75}>
          {POINTS[lang][deg / 45]}
        </text>,
      );
    }
  }
  const km = distanceKm ? `${toNumerals(Math.round(distanceKm).toLocaleString("en"), numerals)} km` : "";
  return (
    <div style={{ width, marginInline: "auto", display: "flex", alignItems: "center", gap: 26 * k, color: ink }} role="img" aria-label={`Qibla ${b} degrees`}>
      <div style={{ flex: "none", lineHeight: 1.1 }}>
        <div style={{ fontSize: 22 * k, letterSpacing: lang === "en" ? "0.26em" : 0, color: accent, fontWeight: 800, textTransform: "uppercase" }}>{label("qibla", lang)}</div>
        <div style={{ fontSize: 44 * k, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginTop: 4 * k }}>
          {toNumerals(String(b), numerals)}° <span style={{ fontSize: "0.62em", color: accent }}>{compassPoint(b, lang)}</span>
        </div>
        {km && <div style={{ fontSize: 21 * k, opacity: 0.7, marginTop: 4 * k, whiteSpace: "nowrap" }}>{km}</div>}
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          aspectRatio: `120 / ${H}`,
          borderBlock: `2px solid ${accent}66`,
          maskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
        }}
      >
        <svg viewBox={`-60 0 120 ${H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, direction: "ltr", overflow: "visible" }}>
          {marks}
          <path d="M0 0.4 L2.6 3.6 L-2.6 3.6Z" fill={accent} />
          <Kaaba x={0} y={12} s={0.62} gold={accent} />
        </svg>
      </div>
    </div>
  );
}
