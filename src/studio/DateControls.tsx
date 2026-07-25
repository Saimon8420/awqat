import { CalendarClock, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useStudio } from "./context";
import { SectionHeader } from "./SectionHeader";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
// A few years back for past-record use, then far forward (through 2100) for
// long-range planning. Miqaat's underlying API supports arbitrary years.
const YEAR_START = CURRENT_YEAR - 4;
const YEAR_END = 2100;
const YEAR_OPTIONS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, i) => YEAR_START + i,
);
// value → label maps so the Select triggers read as "March" / "2026" rather
// than the raw stored value (see Base UI Select's `items` prop).
const MONTH_ITEMS: Record<string, string> = Object.fromEntries(
  MONTH_NAMES.map((name, i) => [String(i + 1), name]),
);
const YEAR_ITEMS: Record<string, string> = Object.fromEntries(
  YEAR_OPTIONS.map((y) => [String(y), String(y)]),
);
const START_MONTH = new Date(YEAR_START, 0);
const END_MONTH = new Date(YEAR_END, 11);

const TRIGGER_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Left-sidebar date controls. For the `daily` format — where the exact day
 * matters — it's a calendar date picker in a popover. For `monthly`/`year`,
 * where only the month/year is meaningful, it's a pair of compact selects.
 * Either way, changes flow through `updateState`, which Studio's fetch effect
 * is keyed on, so the preview refetches/re-renders automatically.
 */
export function DateControls({ inline = false }: { inline?: boolean } = {}) {
  const { state, updateState } = useStudio();

  const selectedDate = new Date(state.year, state.month - 1, state.day);

  const calendar = (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={pickDate}
      defaultMonth={selectedDate}
      captionLayout="dropdown"
      startMonth={START_MONTH}
      endMonth={END_MONTH}
      required
    />
  );

  function pickDate(date: Date | undefined) {
    if (!date) return;
    updateState({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  }

  function changeYear(value: string) {
    const year = Number(value);
    const clampedDay = Math.min(state.day, daysInMonth(year, state.month));
    updateState({ year, day: clampedDay });
  }

  function changeMonth(value: string) {
    const month = Number(value);
    const clampedDay = Math.min(state.day, daysInMonth(state.year, month));
    updateState({ month, day: clampedDay });
  }

  // Whether the selection already points at the current period (the day for
  // "daily", the month for "monthly", the year for "year") — so the
  // "jump to now" shortcut only appears once you've navigated away from it.
  const nowLocal = new Date();
  const curY = nowLocal.getFullYear();
  const curM = nowLocal.getMonth() + 1;
  const curD = nowLocal.getDate();
  const isCurrentPeriod =
    state.format === "year"
      ? state.year === curY
      : state.format === "monthly"
        ? state.year === curY && state.month === curM
        : state.year === curY && state.month === curM && state.day === curD;
  const todayActionLabel =
    state.format === "year" ? "This year" : state.format === "monthly" ? "This month" : "Jump to today";

  function goToday() {
    const n = new Date();
    updateState({ year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Inline (the mobile sheet) already has "Date" in its header. */}
      {!inline && <SectionHeader title="Date" className="border-primary/70" />}

      {state.format === "daily" ? (
        // In a bottom sheet the sheet itself is the surface, so the calendar
        // sits directly in it; on desktop it stays tucked into a popover so
        // the sidebar doesn't lose a month grid's worth of height.
        inline ? (
          <div className="flex justify-center pb-2">{calendar}</div>
        ) : (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2 font-normal"
                />
              }
            >
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span>{TRIGGER_FORMAT.format(selectedDate)}</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
              {calendar}
            </PopoverContent>
          </Popover>
        )
      ) : (
        // Monthly needs Year + Month; the year poster spans all 12 months, so
        // a Month picker there is meaningless — show Year alone.
        <div
          className={
            state.format === "year" ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"
          }
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year-select" className="text-xs font-normal text-muted-foreground">
              Year
            </Label>
            <Select
              items={YEAR_ITEMS}
              value={String(state.year)}
              onValueChange={(v) => changeYear(String(v))}
            >
              <SelectTrigger id="year-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.format !== "year" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="month-select" className="text-xs font-normal text-muted-foreground">
                Month
              </Label>
              <Select
                items={MONTH_ITEMS}
                value={String(state.month)}
                onValueChange={(v) => changeMonth(String(v))}
              >
                <SelectTrigger id="month-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={name} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {!isCurrentPeriod && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToday}
          className="w-fit gap-1.5 self-start px-2 text-primary hover:text-primary"
        >
          <CalendarClock className="size-3.5" />
          {todayActionLabel}
        </Button>
      )}
    </div>
  );
}

export default DateControls;
