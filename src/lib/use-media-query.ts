import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query.
 *
 * Returns `false` wherever `matchMedia` is unavailable (SSR, and jsdom under
 * Vitest), which means the app falls back to its desktop layout in tests —
 * the layout every existing test was written against.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True below Tailwind's `lg` breakpoint — the phone/small-tablet layout. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
