import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStudio } from "./context";

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
// A generous but bounded window around "now" — Miqaat's underlying API
// supports arbitrary years, but an unbounded Select isn't practical, and
// this range comfortably covers past-record and near-future planning use.
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 4 + i);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Left-sidebar controls for which month (and, for the daily format, which
 * day) of `state.year` the preview shows — sits directly under FormatTabs
 * since format and date selection are closely related. Changing any of
 * these updates `StudioState`, which Studio's fetch effect is keyed on, so
 * the preview refetches/re-renders automatically.
 */
export function DateControls() {
  const { state, updateState } = useStudio();
  const lastDay = daysInMonth(state.year, state.month);
  const dayOptions = Array.from({ length: lastDay }, (_, i) => i + 1);

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

  function changeDay(value: string) {
    updateState({ day: Number(value) });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Date</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="year-select" className="text-xs font-normal text-muted-foreground">
            Year
          </Label>
          <Select value={String(state.year)} onValueChange={(v) => changeYear(String(v))}>
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="month-select" className="text-xs font-normal text-muted-foreground">
            Month
          </Label>
          <Select value={String(state.month)} onValueChange={(v) => changeMonth(String(v))}>
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
      </div>

      {state.format === "daily" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="day-select" className="text-xs font-normal text-muted-foreground">
            Day
          </Label>
          <Select value={String(state.day)} onValueChange={(v) => changeDay(String(v))}>
            <SelectTrigger id="day-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default DateControls;
