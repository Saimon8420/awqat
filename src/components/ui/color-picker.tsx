import { HexColorPicker, HexColorInput } from "react-colorful";

import { cn } from "@/lib/utils";

export type ColorPickerProps = {
  /** Current color as a hex string (e.g. `#0f9d63`). */
  value: string;
  /** Fires with the new hex on every change (drag or type). */
  onChange: (hex: string) => void;
  className?: string;
};

/**
 * A shadcn-styled color picker built on react-colorful: a saturation/hue
 * canvas plus a hex text field. react-colorful is dependency-free and
 * pointer-efficient, so dragging stays smooth (persistence is debounced
 * upstream so the drag never blocks on localStorage/URL writes).
 */
export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("awqat-color-picker flex flex-col gap-3", className)}>
      <HexColorPicker color={value} onChange={onChange} />
      <div className="flex items-center gap-2">
        <span
          className="size-8 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <div className="flex flex-1 items-center rounded-md border border-input bg-transparent px-2 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-sm text-muted-foreground">#</span>
          <HexColorInput
            color={value}
            onChange={onChange}
            prefixed={false}
            className="w-full bg-transparent px-1 py-1.5 text-sm uppercase outline-none"
            aria-label="Hex color"
          />
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
