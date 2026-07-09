export type Lang = "en" | "bn" | "ar";
export type LabelKey = "fajr"|"sunrise"|"dhuhr"|"asr"|"maghrib"|"isha"|"sehri"|"iftar"|"qibla"|"ramadan"|"eid"|"day";

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
};

const DIGITS: Record<Lang, string> = { en:"0123456789", bn:"০১২৩৪৫৬৭৮৯", ar:"٠١٢٣٤٥٦٧٨٩" };

export function label(key: LabelKey, lang: Lang): string { return LABELS[key][lang]; }
export function toNumerals(input: string, lang: Lang): string {
  const d = DIGITS[lang];
  return input.replace(/[0-9]/g, (n) => d[Number(n)]);
}
export function dir(lang: Lang): "ltr" | "rtl" { return lang === "ar" ? "rtl" : "ltr"; }
