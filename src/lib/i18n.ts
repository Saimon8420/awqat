export type Lang = "en" | "bn" | "ar";
export type LabelKey =
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "sehri"
  | "iftar"
  | "qibla"
  | "ramadan"
  | "eid"
  | "day"
  | "date"
  | "hijri"
  | "sehriEnds"
  | "next"
  | "nextPrayer"
  | "prayerTimes"
  | "prayerTimetable"
  | "ramadanMubarak";

const LABELS: Record<LabelKey, Record<Lang, string>> = {
  fajr:    { en:"Fajr",    bn:"ফজর",    ar:"الفجر" },
  sunrise: { en:"Sunrise", bn:"সূর্যোদয়", ar:"الشروق" },
  dhuhr:   { en:"Dhuhr",   bn:"যোহর",   ar:"الظهر" },
  asr:     { en:"Asr",     bn:"আসর",    ar:"العصر" },
  maghrib: { en:"Maghrib", bn:"মাগরিব", ar:"المغرب" },
  isha:    { en:"Isha",    bn:"ইশা",    ar:"العشاء" },
  sehri:   { en:"Sehri",   bn:"সেহরি",  ar:"السحور" },
  iftar:   { en:"Iftar",   bn:"ইফতার",  ar:"الإفطار" },
  qibla:   { en:"Qibla",   bn:"কিবলা",  ar:"القبلة" },
  ramadan: { en:"Ramadan", bn:"রমজান",  ar:"رمضان" },
  eid:     { en:"Eid",     bn:"ঈদ",     ar:"عيد" },
  day:     { en:"Day",     bn:"দিন",    ar:"يوم" },
  date:    { en:"Date",    bn:"তারিখ",  ar:"التاريخ" },
  hijri:   { en:"Hijri",   bn:"হিজরি",  ar:"الهجري" },
  sehriEnds:       { en:"Sehri ends",       bn:"সেহরি শেষ",        ar:"نهاية السحور" },
  next:            { en:"Next",             bn:"পরবর্তী",          ar:"التالية" },
  nextPrayer:      { en:"Next prayer",      bn:"পরবর্তী নামাজ",     ar:"الصلاة التالية" },
  prayerTimes:     { en:"Prayer times",     bn:"নামাজের সময়",      ar:"مواقيت الصلاة" },
  prayerTimetable: { en:"Prayer timetable", bn:"নামাজের সময়সূচি",   ar:"جدول مواقيت الصلاة" },
  ramadanMubarak:  { en:"Ramadan Mubarak",  bn:"রমজান মোবারক",     ar:"رمضان مبارك" },
};

const DIGITS: Record<Lang, string> = { en:"0123456789", bn:"০১২৩৪৫৬৭৮৯", ar:"٠١٢٣٤٥٦٧٨٩" };

export function label(key: LabelKey, lang: Lang): string { return LABELS[key][lang]; }
export function toNumerals(input: string, lang: Lang): string {
  const d = DIGITS[lang];
  return input.replace(/[0-9]/g, (n) => d[Number(n)]);
}
export function dir(lang: Lang): "ltr" | "rtl" { return lang === "ar" ? "rtl" : "ltr"; }

/** "in 3h 19m" / "৩ ঘণ্টা ১৯ মিনিট পরে" / "بعد ٣ س ١٩ د" for a positive duration. */
export function inDuration(ms: number, lang: Lang, numerals: Lang): string {
  const total = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const n = (v: number) => toNumerals(String(v), numerals);
  if (lang === "bn") return h > 0 ? `${n(h)} ঘণ্টা ${n(m)} মিনিট পরে` : `${n(m)} মিনিট পরে`;
  if (lang === "ar") return h > 0 ? `بعد ${n(h)} س ${n(m)} د` : `بعد ${n(m)} د`;
  return h > 0 ? `in ${n(h)}h ${n(m)}m` : `in ${n(m)}m`;
}
