import { useRef, type ChangeEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEMES } from "@/templates/themes";
import { MOTIFS } from "@/graphics";
import { GRADIENTS } from "@/graphics/backgrounds";
import { PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "@/templates/shared";
import { label, type Lang } from "@/lib/i18n";
import { useStudio } from "./context";

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

/**
 * The right-hand controls panel: binds every visual/localization field of
 * `StudioState` to a live-updating control. Each control calls
 * `updateState` directly, so the preview (driven by the same state) updates
 * instantly — there's no separate "apply" step.
 */
export function CustomizePanel() {
  const { state, updateState } = useStudio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accentValue = HEX_RE.test(state.accent) ? state.accent : "#0f9d63";

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
      <div>
        <h2 className="text-sm font-semibold text-foreground">Customize</h2>
        <p className="text-xs text-muted-foreground">Every change previews instantly.</p>
      </div>

      {/* Theme */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="theme-select">Theme</Label>
        <Select value={state.theme} onValueChange={(v) => updateState({ theme: String(v) })}>
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
            <span className="truncate">{state.accent}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2">
                {ACCENT_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Accent ${hex}`}
                    className="size-7 rounded-full border border-border transition-transform hover:scale-105"
                    style={{ backgroundColor: hex }}
                    onClick={() => updateState({ accent: hex })}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="accent-custom" className="text-xs font-normal text-muted-foreground">
                  Custom
                </Label>
                <input
                  id="accent-custom"
                  type="color"
                  value={accentValue}
                  onChange={(e) => updateState({ accent: e.target.value })}
                  className="h-8 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
              </div>
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
      </section>

      {/* Motif */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="motif-select">Motif</Label>
        <Select
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

      {/* Language & numerals */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lang-select">Language</Label>
          <Select value={state.lang} onValueChange={(v) => updateState({ lang: v as Lang })}>
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
    </div>
  );
}

export default CustomizePanel;
