import type { FC } from "react";
import { toNumerals, type Lang } from "@/lib/i18n";

export type QiblaCompassProps = {
  /** Bearing to Makkah in degrees, 0-360, 0 = north, clockwise (from `QiblaData.bearing`). */
  bearing: number;
  /** Effective accent color (caller resolves `state.accent || theme.accent`). */
  accent: string;
  numerals: Lang;
  /** Pixel size of the (square) compass face. */
  size?: number;
  className?: string;
};

/**
 * A small SVG compass that rotates a needle to `bearing` degrees (0 = up,
 * clockwise) with a fixed "N" marker at the top and a degrees readout below
 * the dial. Theme-tinted via `accent` (no hardcoded color), used in the
 * daily templates' qibla flourish in place of a plain "Qibla: 278°" line.
 */
export const QiblaCompass: FC<QiblaCompassProps> = ({
  bearing,
  accent,
  numerals,
  size = 96,
  className,
}) => {
  const rounded = Math.round(((bearing % 360) + 360) % 360);
  const degreesLabel = `${toNumerals(String(rounded), numerals)}°`;

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Qibla bearing ${rounded} degrees`}
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke={accent} strokeOpacity="0.15" strokeWidth="1" />
        <text x="50" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill={accent}>
          N
        </text>
        <g transform={`rotate(${bearing} 50 50)`}>
          <polygon points="50,10 44,52 50,44 56,52" fill={accent} />
        </g>
        <circle cx="50" cy="50" r="4" fill={accent} />
      </svg>
      <span className="text-2xl font-semibold" style={{ color: accent }}>
        {degreesLabel}
      </span>
    </div>
  );
};

export default QiblaCompass;
