const BASE = "https://miqaat-dev.vercel.app/v1";
const mem = new Map<string, unknown>();

export function __clearCache() {
  mem.clear();
}

async function cachedGet<T>(
  key: string,
  path: string,
  map: (data: any, meta: any) => T,
): Promise<T> {
  if (mem.has(key)) return mem.get(key) as T;
  const ls = localStorage.getItem(key);
  if (ls) {
    const v = JSON.parse(ls) as T;
    mem.set(key, v);
    return v;
  }
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Miqaat ${res.status}`);
  const body = await res.json();
  const value = map(body.data ?? body, body.meta ?? {});
  mem.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
  return value;
}

export type DayTimes = {
  dateISO: string;
  hijri: { day: number; monthName: string; year: number };
  prayers: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  fasting: { sehri: string; iftar: string };
};
export type MonthlyResponse = {
  location: { lat: number; lon: number; timezone: string };
  method: string;
  madhab: string;
  year: number;
  month: number;
  days: DayTimes[];
};
export type QiblaData = { bearing: number; distanceKm: number };
export type Countdowns = {
  isRamadan: boolean;
  daysUntilRamadan: number;
  daysUntilEidAlFitr: number;
  daysUntilEidAlAdha: number;
};

export function parseHijri(s: string): { day: number; monthName: string; year: number } {
  const m = /^(\d+)\s+(.+?)\s+(\d+)\s+AH$/.exec(s.trim());
  if (!m) throw new Error(`Unparseable hijri: ${s}`);
  return { day: Number(m[1]), monthName: m[2], year: Number(m[3]) };
}

export function getMonthly(p: {
  lat: number;
  lon: number;
  year: number;
  month: number;
  method?: string;
  madhab?: string;
}): Promise<MonthlyResponse> {
  const key = `mq:monthly:${p.lat}:${p.lon}:${p.year}:${p.month}:${p.method ?? ""}:${p.madhab ?? ""}`;
  const q = new URLSearchParams({
    lat: String(p.lat),
    lng: String(p.lon),
    year: String(p.year),
    month: String(p.month),
  });
  if (p.method) q.set("method", p.method);
  if (p.madhab) q.set("madhab", p.madhab);
  return cachedGet(key, `/calendar/monthly?${q}`, (d, meta) => ({
    location: {
      lat: meta.location.latitude,
      lon: meta.location.longitude,
      timezone: meta.location.timezone,
    },
    method: meta.params?.method ?? p.method ?? "",
    madhab: meta.params?.madhab ?? p.madhab ?? "",
    year: d.year,
    month: d.month,
    days: d.days.map(
      (x: any): DayTimes => ({
        dateISO: x.date,
        hijri: parseHijri(x.hijri),
        prayers: {
          fajr: x.prayers.fajr.iso,
          sunrise: x.prayers.sunrise.iso,
          dhuhr: x.prayers.dhuhr.iso,
          asr: x.prayers.asr.iso,
          maghrib: x.prayers.maghrib.iso,
          isha: x.prayers.isha.iso,
        },
        fasting: { sehri: x.fasting.suhoorEnd.iso, iftar: x.fasting.iftar.iso },
      }),
    ),
  }));
}

export function getQibla(p: { lat: number; lon: number }): Promise<QiblaData> {
  const key = `mq:qibla:${p.lat}:${p.lon}`;
  const q = new URLSearchParams({ lat: String(p.lat), lng: String(p.lon) });
  return cachedGet(key, `/qibla?${q}`, (d) => ({
    bearing: d.direction,
    distanceKm: d.distanceToMakkah.km,
  }));
}

export function getCountdowns(p: {
  lat: number;
  lon: number;
  year: number;
  /** Hijri day adjustment for local moon sighting. */
  adjustment?: number;
}): Promise<Countdowns> {
  const key = `mq:events:${p.lat}:${p.lon}:${p.year}:${p.adjustment ?? 0}`;
  const q = new URLSearchParams({
    lat: String(p.lat),
    lng: String(p.lon),
    year: String(p.year),
  });
  if (p.adjustment) q.set("adjustment", String(p.adjustment));
  return cachedGet(key, `/calendar/events?${q}`, (d) => ({
    isRamadan: d.isRamadan,
    daysUntilRamadan: d.daysUntilRamadan,
    daysUntilEidAlFitr: d.daysUntilEidAlFitr,
    daysUntilEidAlAdha: d.daysUntilEidAlAdha,
  }));
}

export function getMethods(): Promise<{ id: string; name: string }[]> {
  return cachedGet("mq:methods", `/methods`, (d) => d.calculationMethods);
}
