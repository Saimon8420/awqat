import type React from "react";
import type { Countdowns, MonthlyResponse, QiblaData } from "@/lib/miqaat";
import type { SpecialType } from "@/lib/calendar";
import type { StudioState } from "@/lib/state";
import type { DesignId, ThemeTokens } from "./themes";
import { MihrabDaily, MihrabMonthly, MihrabYear } from "./designs/mihrab";
import { ParchmentDaily, ParchmentMonthly, ParchmentYear } from "./designs/parchment";
import { DaylightDaily, DaylightMonthly, DaylightYear } from "./designs/daylight";

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
 * The three card designs. Each renders every format, so switching between
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
];

export function designById(id: string): DesignDef {
  return DESIGNS.find((d) => d.id === id) ?? DESIGNS[0];
}

export function componentFor(design: string, format: Format): React.FC<TemplateProps> {
  return designById(design).components[format];
}
