const GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";

export type CitySearchResult = {
  name: string;
  lat: number;
  lon: number;
  country: string;
};

/**
 * Searches for cities by name via the free Open-Meteo geocoding API (no API
 * key required). Callers are expected to debounce their own input.
 */
export async function searchCity(q: string, count = 10): Promise<CitySearchResult[]> {
  const url = `${GEOCODE_BASE}?name=${encodeURIComponent(q)}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding ${res.status}`);
  const body = await res.json();
  const results = body.results ?? [];
  return results.map(
    (r: any): CitySearchResult => ({
      name: r.name,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country,
    }),
  );
}

// Country name -> confirmed real Miqaat calculation method id.
// Keys are matched case-insensitively against the input country name.
const COUNTRY_METHOD: Record<string, string> = {
  // Karachi (South Asia)
  bangladesh: "Karachi",
  pakistan: "Karachi",
  india: "Karachi",
  "sri lanka": "Karachi",
  nepal: "Karachi",
  bhutan: "Karachi",
  afghanistan: "Karachi",

  // Egyptian
  egypt: "Egyptian",
  sudan: "Egyptian",
  libya: "Egyptian",
  syria: "Egyptian",
  jordan: "Egyptian",
  lebanon: "Egyptian",
  iraq: "Egyptian",
  palestine: "Egyptian",

  // Umm al-Qura
  "saudi arabia": "UmmAlQura",

  // North America (ISNA)
  "united states": "NorthAmerica",
  usa: "NorthAmerica",
  "united states of america": "NorthAmerica",
  canada: "NorthAmerica",
  mexico: "NorthAmerica",

  // Turkey (Diyanet)
  turkey: "Turkey",
  turkiye: "Turkey",

  // Dubai
  "united arab emirates": "Dubai",
  uae: "Dubai",

  // Kuwait
  kuwait: "Kuwait",

  // Qatar
  qatar: "Qatar",

  // Singapore (also covers nearby SE Asia using the same convention)
  singapore: "Singapore",
  malaysia: "Singapore",
  indonesia: "Singapore",
  brunei: "Singapore",

  // Tehran (Iran)
  iran: "Tehran",

  // Moonsighting Committee
  "united kingdom": "MoonsightingCommittee",
  uk: "MoonsightingCommittee",

  // Muslim World League default region examples (explicit, though it's
  // also the fallback for anything unmapped)
  france: "MuslimWorldLeague",
  germany: "MuslimWorldLeague",
};

const DEFAULT_METHOD = "MuslimWorldLeague";

/** Maps a country name to a sensible default Miqaat calculation method id. */
export function defaultMethod(country: string): string {
  const key = country.trim().toLowerCase();
  return COUNTRY_METHOD[key] ?? DEFAULT_METHOD;
}

/** Wraps navigator.geolocation.getCurrentPosition in a Promise. */
export function currentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
    );
  });
}
