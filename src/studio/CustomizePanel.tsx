import { useRef, type ChangeEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { THEMES } from "@/templates/themes";
import { MOTIFS } from "@/graphics";
import { GRADIENTS } from "@/graphics/backgrounds";
import { PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "@/templates/shared";
import { label, type Lang } from "@/lib/i18n";
import { useStudio } from "./context";
import { CalculationFields } from "./CalculationFields";
import { PersonalizeFields } from "./PersonalizeFields";

const NONE = "none";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// A small curated palette for the accent swatch grid — drawn from the
// shipped themes' accent colors plus a few extras, so the presets always
// look good against at least one theme.
const ACCENT_PRESETS = [
  "#0f9d63",
  "#d4af37",
  "#ff7849",
  "#171717",
  "#5b8def",
  "#c9a24b",
  "#e11d48",
  "#7c3aed",
  "#0891b2",
  "#f59e0b",
];

const LANGUAGE_OPTIONS: { value: Lang; name: string }[] = [
  { value: "en", name: "English" },
  { value: "bn", name: "বাংলা" },
  { value: "ar", name: "العربية" },
];

const NUMERAL_OPTIONS: { value: Lang; name: string }[] = [
  { value: "en", name: "Western (0-9)" },
  { value: "bn", name: "Bengali (০-৯)" },
  { value: "ar", name: "Arabic (٠-٩)" },
];

// value → label maps so each Select's trigger shows the friendly name (e.g.
// "Gold on Navy") instead of the raw id ("gold-navy"). Base UI's Select.Value
// reads these off the Root's `items` prop.
const THEME_ITEMS: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.id, t.name]));
const GRADIENT_ITEMS: Record<string, string> = {
  none: "None",
  ...Object.fromEntries(GRADIENTS.map((g) => [g.id, g.name])),
};
const MOTIF_ITEMS: Record<string, string> = {
  none: "None",
  ...Object.fromEntries(MOTIFS.map((m) => [m.id, m.name])),
};
const LANGUAGE_ITEMS: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((o) => [o.value, o.name]),
);
const NUMERAL_ITEMS: Record<string, string> = Object.fromEntries(
  NUMERAL_OPTIONS.map((o) => [o.value, o.name]),
);

/**
 * The right-hand controls panel: binds every visual/localization field of
 * `StudioState` to a live-updating control. Each control calls
 * `updateState` directly, so the preview (driven by the same state) updates
 * instantly — there's no separate "apply" step.
 */
export function CustomizePanel({ hideHeading = false }: { hideHeading?: boolean } = {}) {
  const { state, updateState } = useStudio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomAccent = HEX_RE.test(state.accent);
  const currentTheme = THEMES.find((t) => t.id === state.theme) ?? THEMES[0];
  // The effective accent: the user's custom pick when set, otherwise the
  // current theme's accent — never the raw (possibly bogus/legacy) string
  // stored in state.accent.
  const accentValue = isCustomAccent ? state.accent : currentTheme.accent;

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateState({ bgImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
    // Allow re-selecting the same file later (e.g. after clearing).
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-6 text-sm">
      {!hideHeading && (
        <div>
          <h2 className="text-sm font-semibold text-foreground">Customize</h2>
          <p className="text-xs text-muted-foreground">Every change previews instantly.</p>
        </div>
      )}

      {/* Theme */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="theme-select">Theme</Label>
        <Select
          items={THEME_ITEMS}
          value={state.theme}
          onValueChange={(v) => updateState({ theme: String(v) })}
        >
          <SelectTrigger id="theme-select" className="w-full">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Accent color */}
      <section className="flex flex-col gap-1.5">
        <Label>Accent color</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button type="button" variant="outline" className="w-full justify-start gap-2" />
            }
          >
            <span
              className="size-4 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: accentValue }}
              aria-hidden="true"
            />
            <span className="truncate">
              {isCustomAccent ? accentValue : "Theme default"}
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="flex flex-col gap-3">
              <ColorPicker value={accentValue} onChange={(hex) => updateState({ accent: hex })} />
              <div>
                <p className="mb-1.5 text-xs font-normal text-muted-foreground">Presets</p>
                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Accent ${hex}`}
                      className="size-7 rounded-full border border-border outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                      style={{ backgroundColor: hex }}
                      onClick={() => updateState({ accent: hex })}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => updateState({ accent: "" })}
              >
                Theme default
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </section>

      {/* Background */}
      <section className="flex flex-col gap-2">
        <Label>Background</Label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gradient-select" className="text-xs font-normal text-muted-foreground">
            Gradient
          </Label>
          <Select
            items={GRADIENT_ITEMS}
            value={state.gradient ?? NONE}
            onValueChange={(v) =>
              updateState({ gradient: v === NONE ? undefined : String(v) })
            }
          >
            <SelectTrigger id="gradient-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {GRADIENTS.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bg-photo-input" className="text-xs font-normal text-muted-foreground">
            Photo
          </Label>
          <input
            ref={fileInputRef}
            id="bg-photo-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
          />
          {state.bgImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => updateState({ bgImage: undefined })}
            >
              Clear photo
            </Button>
          )}
        </div>

        {state.bgImage && (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bg-dim-slider" className="text-xs font-normal text-muted-foreground">
                  Dim
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {state.bgDim ?? 55}%
                </span>
              </div>
              <Slider
                id="bg-dim-slider"
                min={0}
                max={100}
                value={state.bgDim ?? 55}
                onValueChange={(v) => updateState({ bgDim: v as number })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bg-blur-slider" className="text-xs font-normal text-muted-foreground">
                  Blur
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {state.bgBlur ?? 0}px
                </span>
              </div>
              <Slider
                id="bg-blur-slider"
                min={0}
                max={20}
                value={state.bgBlur ?? 0}
                onValueChange={(v) => updateState({ bgBlur: v as number })}
              />
            </div>
          </>
        )}
      </section>

      {/* Motif */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="motif-select">Motif</Label>
        <Select
          items={MOTIF_ITEMS}
          value={state.motif ?? NONE}
          onValueChange={(v) => updateState({ motif: v === NONE ? undefined : String(v) })}
        >
          <SelectTrigger id="motif-select" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {MOTIFS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Layout */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="radius-slider">Corner radius</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {state.radius ?? 0}px
          </span>
        </div>
        <Slider
          id="radius-slider"
          min={0}
          max={48}
          value={state.radius ?? 0}
          onValueChange={(v) => updateState({ radius: v as number })}
        />
      </section>

      {/* Language & numerals */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lang-select">Language</Label>
          <Select
            items={LANGUAGE_ITEMS}
            value={state.lang}
            onValueChange={(v) => updateState({ lang: v as Lang })}
          >
            <SelectTrigger id="lang-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="numerals-select">Numerals</Label>
          <Select
            items={NUMERAL_ITEMS}
            value={state.numerals}
            onValueChange={(v) => updateState({ numerals: v as Lang })}
          >
            <SelectTrigger id="numerals-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMERAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Time format */}
      <section className="flex items-center justify-between gap-2">
        <Label htmlFor="hour12-switch">12-hour clock</Label>
        <Switch
          id="hour12-switch"
          checked={state.hour12}
          onCheckedChange={(checked) => updateState({ hour12: checked })}
        />
      </section>

      {/* How the times are computed — sits with the other timetable controls
          rather than behind the location field. */}
      <CalculationFields />

      {/* Row visibility */}
      <section className="flex flex-col gap-2">
        <Label>Prayer rows</Label>
        <div className="flex flex-col gap-2">
          {PRAYER_ROW_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <Label htmlFor={`row-switch-${key}`} className="font-normal">
                {label(ROW_LABEL_KEYS[key], "en")}
              </Label>
              <Switch
                id={`row-switch-${key}`}
                checked={state.showRows[key] !== false}
                onCheckedChange={(checked) =>
                  updateState({ showRows: { ...state.showRows, [key]: checked } })
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Qibla */}
      <section className="flex items-center justify-between gap-2">
        <Label htmlFor="qibla-switch">Show Qibla</Label>
        <Switch
          id="qibla-switch"
          checked={state.showQibla}
          onCheckedChange={(checked) => updateState({ showQibla: checked })}
        />
      </section>

      {/* Personalize: lane-aware (organization vs personal) fields, see
          PersonalizeFields for the branching logic. */}
      <PersonalizeFields />
    </div>
  );
}

export default CustomizePanel;
