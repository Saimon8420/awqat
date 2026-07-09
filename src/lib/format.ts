import { toNumerals, type Lang } from "./i18n";

// Some ICU builds insert a narrow no-break space (U+202F) or non-breaking
// space (U+00A0) before AM/PM instead of a regular space. Normalize these to
// a plain ASCII space so output is stable across environments.
const NON_ASCII_SPACES = new RegExp("[\\u202F\\u00A0]", "g");

export function formatTime(
  iso: string,
  opts: { hour12: boolean; lang: Lang; timezone: string },
): string {
  const d = new Date(iso);
  const raw = new Intl.DateTimeFormat("en-US", {
    hour: opts.hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: opts.hour12,
    timeZone: opts.timezone,
  }).format(d);
  const normalized = raw.replace(NON_ASCII_SPACES, " ");
  return toNumerals(normalized, opts.lang);
}
