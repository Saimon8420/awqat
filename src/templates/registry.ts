import type React from "react";
import type { Countdowns, MonthlyResponse, QiblaData } from "@/lib/miqaat";
import type { SpecialType } from "@/lib/calendar";
import type { StudioState } from "@/lib/state";
import type { ThemeTokens } from "./themes";
import { PersonalDaily } from "./daily/PersonalDaily";
import { OrgDaily } from "./daily/OrgDaily";
import { PersonalMonthly } from "./monthly/PersonalMonthly";
import { OrgMonthly } from "./monthly/OrgMonthly";
import { RamadanMonthly } from "./monthly/RamadanMonthly";

export type TemplateProps = {
  monthly: MonthlyResponse;
  qibla?: QiblaData;
  specialDays: Record<string, SpecialType[]>;
  countdowns?: Countdowns;
  state: StudioState;
  theme: ThemeTokens;
};

export type TemplateDef = {
  id: string;
  name: string;
  lane: "personal" | "organization";
  format: "daily" | "monthly" | "year";
  Component: React.FC<TemplateProps>;
  thumbnail?: string;
};

// Stub component — the Year format template lands in Task 12. This
// placeholder exists purely so the registry/format filters have at least
// one entry for "year" and the lane filter has something to narrow.
const StubYear: React.FC<TemplateProps> = () => null;

export const TEMPLATES: TemplateDef[] = [
  {
    id: "daily-classic",
    name: "Daily Classic",
    lane: "personal",
    format: "daily",
    Component: PersonalDaily,
  },
  {
    id: "daily-org",
    name: "Daily Masjid Schedule",
    lane: "organization",
    format: "daily",
    Component: OrgDaily,
  },
  {
    id: "monthly-classic",
    name: "Monthly Classic",
    lane: "personal",
    format: "monthly",
    Component: PersonalMonthly,
  },
  {
    id: "monthly-masjid",
    name: "Monthly Masjid Schedule",
    lane: "organization",
    format: "monthly",
    Component: OrgMonthly,
  },
  {
    id: "monthly-ramadan",
    name: "Ramadan",
    lane: "personal",
    format: "monthly",
    Component: RamadanMonthly,
  },
  {
    id: "year-overview",
    name: "Year Overview",
    lane: "personal",
    format: "year",
    Component: StubYear,
  },
];

export function templatesFor(
  format: TemplateDef["format"],
  lane?: TemplateDef["lane"],
): TemplateDef[] {
  return TEMPLATES.filter(
    (t) => t.format === format && (lane === undefined || t.lane === lane),
  );
}
