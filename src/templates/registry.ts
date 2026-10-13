import type React from "react";
import type { Countdowns, MonthlyResponse, QiblaData } from "@/lib/miqaat";
import type { SpecialType } from "@/lib/calendar";
import type { StudioState } from "@/lib/state";
import type { DesignId, ThemeTokens } from "./themes";
import { MihrabDaily, MihrabMonthly, MihrabYear } from "./designs/mihrab";
import { ParchmentDaily, ParchmentMonthly, ParchmentYear } from "./designs/parchment";
import { DaylightDaily, DaylightMonthly, DaylightYear } from "./designs/daylight";
import { AlhambraDaily, AlhambraMonthly, AlhambraYear } from "./designs/alhambra";
import { LanternDaily, LanternMonthly, LanternYear } from "./designs/lantern";
import { MinimalDaily, MinimalMonthly, MinimalYear } from "./designs/minimal";
import { DesertDaily, DesertMonthly, DesertYear } from "./designs/desert";
import { SixtyDomeDaily, SixtyDomeMonthly, SixtyDomeYear } from "./designs/sixtydome";
import { KiswaDaily, KiswaMonthly, KiswaYear } from "./designs/kiswa";
import { CrescentDaily, CrescentMonthly, CrescentYear } from "./designs/crescent";

export type TemplateProps = {
  monthly: MonthlyResponse;
  qibla?: QiblaData;
  specialDays: Record<string, SpecialType[]>;
  countdowns?: Countdowns;
  state: StudioState;
  theme: ThemeTokens;
  /**
   * All 12 months (Jan..Dec, index 0..11) of `state.year`, fetched only for
   * the "year" format (see Studio's year-fetch effect). `undefined` while
   * unfetched/not applicable; only the year posters use it.
   */
  months?: MonthlyResponse[];
};

export type Format = StudioState["format"];

export type DesignDef = {
  id: DesignId;
  name: string;
  /** One line on what the design is best for, shown in the Designs panel. */
  blurb: string;
  components: Record<Format, React.FC<TemplateProps>>;
};

/**
 * The card designs. Each renders every format, so switching between
 * Daily / Monthly / Year keeps the look; Masjid and Ramadan are switches on
 * top of any design rather than separate templates.
 */
export const DESIGNS: DesignDef[] = [
  {
    id: "mihrab",
    name: "Mihrab Night",
    blurb: "Night-blue and gold inside a mihrab arch. Made for sharing.",
    components: { daily: MihrabDaily, monthly: MihrabMonthly, year: MihrabYear },
  },
  {
    id: "parchment",
    name: "Parchment & Ink",
    blurb: "A printed almanac on warm paper. Made for printing.",
    components: { daily: ParchmentDaily, monthly: ParchmentMonthly, year: ParchmentYear },
  },
  {
    id: "daylight",
    name: "Daylight",
    blurb: "The next prayer as the hero, under a daytime sky. Made for phones.",
    components: { daily: DaylightDaily, monthly: DaylightMonthly, year: DaylightYear },
  },
  {
    id: "alhambra",
    name: "Alhambra",
    blurb: "Andalusian arches over sand and turquoise. Calm and elegant, made for printing.",
    components: { daily: AlhambraDaily, monthly: AlhambraMonthly, year: AlhambraYear },
  },
  {
    id: "lantern",
    name: "Lantern Night",
    blurb: "Hanging lanterns glowing over a deep night. Festive, made for Ramadan and Eid.",
    components: { daily: LanternDaily, monthly: LanternMonthly, year: LanternYear },
  },
  {
    id: "minimal",
    name: "Modern Minimal",
    blurb: "No ornament: the next prayer as one big number. Reads at a glance.",
    components: { daily: MinimalDaily, monthly: MinimalMonthly, year: MinimalYear },
  },
  {
    id: "desert",
    name: "Desert Dusk",
    blurb: "A caravan crossing the dunes at sunset. Warm and eye-catching for stories.",
    components: { daily: DesertDaily, monthly: DesertMonthly, year: DesertYear },
  },
  {
    id: "sixtydome",
    name: "Sixty Dome",
    blurb: "Bagerhat's Sixty Dome Mosque in brick. Rooted in Bangladesh, great for masjids.",
    components: { daily: SixtyDomeDaily, monthly: SixtyDomeMonthly, year: SixtyDomeYear },
  },
  {
    id: "kiswa",
    name: "Kiswa Gold",
    blurb: "A woven cover crossed by a gold calligraphy belt. Solemn and premium.",
    components: { daily: KiswaDaily, monthly: KiswaMonthly, year: KiswaYear },
  },
  {
    id: "crescent",
    name: "Crescent Skyline",
    blurb: "A glowing crescent over domes and minarets. Bold and easy to read.",
    components: { daily: CrescentDaily, monthly: CrescentMonthly, year: CrescentYear },
  },
];

export function designById(id: string): DesignDef {
  return DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];
}

export function componentFor(design: string, format: Format): React.FC<TemplateProps> {
  return designById(design).components[format];
}
