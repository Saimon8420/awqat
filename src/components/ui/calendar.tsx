import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DropdownProps } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * The month/year navigation dropdowns.
 *
 * react-day-picker's built-in `Dropdown` renders a native `<select>`, which
 * pops the OS's own list — jarring next to the rest of the app's controls, and
 * unstyleable. This swaps in the app's Select, translating its value back into
 * the change event the library's navigation handler expects.
 */
function CalendarDropdown({ options, value, onChange, disabled, ...props }: DropdownProps) {
  const opts = options ?? [];
  const items = Object.fromEntries(opts.map((o) => [String(o.value), o.label]));

  return (
    <Select
      items={items}
      value={value !== undefined ? String(value) : undefined}
      disabled={disabled}
      onValueChange={(next) => {
        onChange?.({
          target: { value: String(next) },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={props["aria-label"]}
        className="h-7 gap-1 border-transparent px-2 font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="center" className="max-h-56">
        {opts.map((o) => (
          <SelectItem key={o.value} value={String(o.value)} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A shadcn-styled wrapper over react-day-picker (v10). Layout comes from the
 * library's base stylesheet; the `classNames` overrides below re-skin it to
 * the app's tokens — a primary-filled selected day, muted today ring, ghost
 * nav arrows, and dropdown month/year navigation for quick jumps.
 */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("awqat-calendar p-1", className)}
      classNames={{
        root: cn(defaults.root, "text-sm"),
        months: cn(defaults.months, "relative flex flex-col gap-2"),
        month: cn(defaults.month, "flex flex-col gap-2"),
        month_caption: cn(defaults.month_caption, "flex items-center justify-center h-8 px-8"),
        caption_label: cn(defaults.caption_label, "text-sm font-medium"),
        // `dropdown` / `dropdown_root` intentionally omitted: they only style
        // the built-in native-select dropdown, which CalendarDropdown replaces.
        dropdowns: cn(defaults.dropdowns, "flex items-center justify-center gap-1"),
        nav: cn(defaults.nav, "absolute inset-x-0 top-0 flex items-center justify-between px-1"),
        button_previous: cn(
          defaults.button_previous,
          "inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        ),
        button_next: cn(
          defaults.button_next,
          "inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        ),
        month_grid: cn(defaults.month_grid, "w-full border-collapse"),
        weekdays: cn(defaults.weekdays, "flex"),
        weekday: cn(defaults.weekday, "w-8 text-[0.7rem] font-normal text-muted-foreground"),
        week: cn(defaults.week, "mt-1 flex w-full"),
        day: cn(defaults.day, "size-8 p-0 text-center"),
        day_button: cn(
          defaults.day_button,
          "inline-flex size-8 items-center justify-center rounded-md font-normal outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring aria-selected:opacity-100",
        ),
        today: cn(defaults.today, "font-semibold text-primary"),
        selected: cn(
          defaults.selected,
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground",
        ),
        outside: cn(defaults.outside, "text-muted-foreground/50"),
        disabled: cn(defaults.disabled, "text-muted-foreground/30"),
        hidden: cn(defaults.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Chevron: ({ orientation, className: cls, ...rest }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", cls)} {...rest} />;
        },
      }}
      {...props}
    />
  );
}

export default Calendar;
