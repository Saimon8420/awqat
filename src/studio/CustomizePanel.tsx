import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "@/templates/shared";
import { label, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useStudio } from "./context";
import { BackgroundField } from "./BackgroundField";
import { CalculationFields } from "./CalculationFields";
import { PersonalizeFields, templateShowsQibla } from "./PersonalizeFields";
import { SectionHeader } from "./SectionHeader";

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
 * A labelled cluster of related controls. The header sticks to the top of the
 * scroll container (the desktop aside or the mobile Style sheet) so you always
 * know which category you're in while scrolling a long panel.
 */
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Whether the header is currently pinned to the top of the scroll container.
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver !== "function") return;
    // Watch a 1px sentinel sitting at the group's top against the nearest
    // scrollable ancestor (the desktop aside or the mobile sheet body). When it
    // scrolls out of the top, the header is pinned — so we can elevate it.
    let root: HTMLElement | null = sentinel.parentElement;
    while (root && root !== document.body) {
      const oy = getComputedStyle(root).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      root = root.parentElement;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root: root ?? null, threshold: [0] },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative flex flex-col gap-4">
      {/* Sentinel at the group's top edge; its leaving the scrollport tells us
          the header below has pinned (see effect above). */}
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />
      {/* Full-bleed sticky band (negative margin cancels the panel's px-4 so it
          spans edge to edge) with a small emerald tick, so each group reads as
          a deliberate section anchor rather than a floating gray label. When
          pinned it gains a soft drop shadow so it visibly floats above the
          scrolling content. */}
      <SectionHeader
        title={title}
        className={cn(
          "sticky top-0 z-10 bg-background transition-[box-shadow,border-color] duration-150",
          stuck
            ? "border-primary shadow-[0_6px_14px_-6px_rgba(15,157,99,0.45)]"
            : "border-primary/70",
        )}
      />
      {children}
    </section>
  );
}

/**
 * The right-hand controls panel: binds every visual/localization field of
 * `StudioState` to a live-updating control, organized into labelled groups
 * (Style / Format / Times / Personalize). Each control calls `updateState`
 * directly, so the preview (driven by the same state) updates instantly —
 * there's no separate "apply" step.
 */
export function CustomizePanel({ hideHeading = false }: { hideHeading?: boolean } = {}) {
  const { state, updateState } = useStudio();

  const isCustomAccent = HEX_RE.test(state.accent);
  const currentTheme = THEMES.find((t) => t.id === state.theme) ?? THEMES[0];
  // The effective accent: the user's custom pick when set, otherwise the
  // current theme's accent — never the raw (possibly bogus/legacy) string
  // stored in state.accent.
  const accentValue = isCustomAccent ? state.accent : currentTheme.accent;

  return (
    // The scroll container (desktop aside) drops its top padding so sticky
    // group headers pin flush to the very top — no gap for content to peek
    // through above a header. `pt-4` restores the resting top breathing room
    // here (it scrolls away). The mobile sheet supplies its own top spacing.
    <div className={cn("flex flex-col gap-6 text-sm", !hideHeading && "pt-4")}>
      {!hideHeading && (
        <div>
          <h2 className="text-sm font-semibold text-foreground">Customize</h2>
          <p className="text-xs text-muted-foreground">Every change previews instantly.</p>
        </div>
      )}

      <SettingsGroup title="Style">
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
              <span className="truncate">{isCustomAccent ? accentValue : "Theme default"}</span>
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

        {/* Background — one mutually-exclusive source (none / gradient / photo). */}
        <BackgroundField />

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

        {/* Corner radius */}
        <section className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="radius-slider">Corner radius</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{state.radius ?? 0}px</span>
          </div>
          <Slider
            id="radius-slider"
            min={0}
            max={48}
            value={state.radius ?? 0}
            onValueChange={(v) => updateState({ radius: v as number })}
          />
        </section>
      </SettingsGroup>

      <SettingsGroup title="Format">
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
      </SettingsGroup>

      <SettingsGroup title="Times">
        {/* How the times are computed (method + Asr madhab). */}
        <CalculationFields />

        {/* Row visibility — which prayers appear on the card. An even 3×2 grid
            of equal-width toggle chips (styled buttons, aria-pressed) reads as a
            tidy set rather than ragged tags; each flips the same showRows
            boolean. Solid-emerald = shown, matching the app's active-state color. */}
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label>Prayer rows</Label>
            <span className="text-[0.7rem] text-muted-foreground">Shown on card</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRAYER_ROW_KEYS.map((key) => {
              const shown = state.showRows[key] !== false;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={shown}
                  onClick={() =>
                    updateState({ showRows: { ...state.showRows, [key]: !shown } })
                  }
                  className={cn(
                    "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    shown
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {label(ROW_LABEL_KEYS[key], "en")}
                </button>
              );
            })}
          </div>
        </section>

        {/* Qibla — only the daily cards render the compass, so the toggle is
            hidden on monthly/year where it would do nothing. */}
        {templateShowsQibla(state) && (
          <section className="flex items-center justify-between gap-2">
            <Label htmlFor="qibla-switch">Show Qibla</Label>
            <Switch
              id="qibla-switch"
              checked={state.showQibla}
              onCheckedChange={(checked) => updateState({ showQibla: checked })}
            />
          </section>
        )}
      </SettingsGroup>

      <SettingsGroup title="Personalize">
        {/* Lane-aware (organization vs personal) fields, see PersonalizeFields
            for the branching logic. */}
        <PersonalizeFields />
      </SettingsGroup>
    </div>
  );
}

export default CustomizePanel;
