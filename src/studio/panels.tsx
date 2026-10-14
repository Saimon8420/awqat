import { useId, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useDraft } from "@/lib/use-draft";
import { HIJRI_ADJUST_MAX, HIJRI_ADJUST_MIN, hijriFor } from "@/lib/hijri-adjust";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { MOTIFS } from "@/graphics";
import { PRAYER_ROW_KEYS, ROW_LABEL_KEYS } from "@/templates/shared";
import { DESIGNS } from "@/templates/registry";
import { resolveTheme, themesFor } from "@/templates/themes";
import { label, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useStudio } from "./context";
import { BackgroundField } from "./BackgroundField";
import { CalculationFields } from "./CalculationFields";
import { PersonalizeFields, templateShowsQibla } from "./PersonalizeFields";
import { LocationBar } from "./LocationBar";
import { DesignThumb, useApplyDesign, useThumbState } from "./DesignStrip";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const ACCENT_PRESETS = [
  "#e8c977",
  "#a3482a",
  "#0f5c45",
  "#2d3f7a",
  "#4a2f6e",
  "#0d3f63",
  "#e11d48",
  "#0891b2",
  "#f59e0b",
  "#171717",
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
const NUMERAL_SHORT: Record<Lang, string> = { en: "0-9", bn: "০-৯", ar: "٠-٩" };
const LANGUAGE_ITEMS = Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.name]));
const NUMERAL_ITEMS = Object.fromEntries(NUMERAL_OPTIONS.map((o) => [o.value, o.name]));

export type PanelId = "designs" | "style" | "text" | "times" | "place";

export const PANEL_META: Record<PanelId, { title: string; hint: string }> = {
  designs: { title: "Designs", hint: "Pick a look. Works for daily, monthly and year." },
  style: { title: "Style", hint: "Every change shows instantly." },
  text: { title: "Text", hint: "Language, numbers and your own words." },
  times: { title: "Times", hint: "How the times are calculated and shown." },
  place: { title: "Place", hint: "Times are calculated for this place." },
};

/**
 * One settings group as a quiet card that opens and closes. The heading shows
 * the current value ("Colour · Navy & Gold"), so a closed group still says
 * what it's set to and the panel needs far less scrolling.
 */
export function Section({ title, value, children, defaultOpen = true }: { title: string; value?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={cn("rounded-xl border border-border transition-colors", open ? "bg-[#fffefb]" : "bg-card")}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-xl px-3.5 text-left outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-[0.86rem] font-semibold">{title}</span>
          {value != null && <span className="ml-auto min-w-0 max-w-[58%] truncate text-xs text-muted-foreground">{value}</span>}
          <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", value == null && "ml-auto", open && "rotate-180")} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div id={id} className="flex flex-col gap-3 px-3.5 pt-1 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}

/** On/off rows grouped in one bordered list. */
function ToggleList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70 px-3">{children}</div>;
}


function ToggleRow({
  id,
  children,
  checked,
  onChange,
  hint,
}: {
  id: string;
  children: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[0.82rem] font-semibold">
          {children}
        </Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function DesignsPanel() {
  const { state, updateState, setRamadanTouched, monthly } = useStudio();
  const thumbState = useThumbState(state);
  const apply = useApplyDesign();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3">
        {DESIGNS.map((d) => {
          const theme = resolveTheme(d.id, d.id === state.template ? state.theme : undefined);
          const on = d.id === state.template;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={on}
              onClick={() => apply(theme)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50",
              )}
            >
              <span className="shrink-0 overflow-hidden rounded-lg shadow-sm">
                {monthly ? (
                  <DesignThumb design={d.id} theme={theme} monthly={monthly} state={thumbState} width={64} />
                ) : (
                  <span className="block h-[114px] w-16" style={{ background: `linear-gradient(180deg, ${theme.sky[0]}, ${theme.sky[2]})` }} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-serif text-base font-semibold">
                  {d.name}
                  {on && <CheckIcon className="size-4 text-primary" />}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{d.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <Section title="Modes" value={modesText(state)}>
          <ToggleList>
      <ToggleRow
        id="masjid-switch"
        checked={state.masjid}
        onChange={(v) => updateState({ masjid: v })}
        hint="Adds your mosque's logo, name and address."
      >
        Masjid mode
      </ToggleRow>
      <ToggleRow
        id="ramadan-switch"
        checked={state.ramadan}
        onChange={(v) => {
          setRamadanTouched(true);
          updateState({ ramadan: v });
        }}
        hint="Sehri and Iftar first; Ramadan nights highlighted."
      >
        Ramadan mode
      </ToggleRow>
          </ToggleList>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function RadiusField() {
  const { state, updateState } = useStudio();
  const [radius, setRadius] = useDraft(state.radius ?? 0, (v: number) => updateState({ radius: v }));
  return (
    <div className="flex items-center gap-3">
      <Slider
        id="radius-slider"
        aria-label="Corner radius"
        min={0}
        max={48}
        value={radius}
        onValueChange={(v) => setRadius(v as number)}
        className="flex-1"
      />
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{radius}px</span>
    </div>
  );
}

function AccentField() {
  const { state, updateState } = useStudio();
  const theme = resolveTheme(state.template, state.theme);
  const [accent, setAccent] = useDraft(state.accent, (v: string) => updateState({ accent: v }));
  const custom = HEX_RE.test(accent);
  const value = custom ? accent : theme.accent;
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-start gap-2" />}>
        <span className="size-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: value }} aria-hidden="true" />
        <span className="truncate">{custom ? value : "Design default"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-3">
          <ColorPicker value={value} onChange={setAccent} />
          <div className="grid grid-cols-5 gap-2">
            {ACCENT_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={`Accent ${hex}`}
                className="size-7 rounded-full border border-border outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
                style={{ backgroundColor: hex }}
                onClick={() => setAccent(hex)}
              />
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setAccent("")}>
            Design default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StylePanel({ withModes = false }: { withModes?: boolean } = {}) {
  const { state, updateState, setRamadanTouched } = useStudio();
  const apply = useApplyDesign();
  const variants = themesFor(state.template);
  const activeTheme = resolveTheme(state.template, state.theme).id;

  return (
    <div className="flex flex-col gap-3">
      <Section title="Colour" value={resolveTheme(state.template, state.theme).name}>
      <div className="grid grid-cols-4 gap-2">
        {variants.map((t) => {
          const on = t.id === activeTheme;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.name}
              aria-pressed={on}
              title={t.name}
              onClick={() => apply(t)}
              className={cn(
                "aspect-square rounded-[10px] border-2 outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary" : "border-transparent",
              )}
              style={{
                background: `linear-gradient(135deg, ${t.sky[0]}, ${t.sky[2]})`,
                boxShadow: `inset 0 0 0 3px ${on ? "#fff" : "transparent"}, inset 0 0 0 6px ${t.accent}`,
              }}
            />
          );
        })}
      </div>

      <AccentField />
      </Section>

      <Section title="Ornament" value={MOTIFS.find((m) => m.id === state.motif)?.name ?? "None"}>
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          aria-pressed={!state.motif}
          title="None"
          onClick={() => updateState({ motif: undefined })}
          className={cn(
            "grid aspect-square place-items-center rounded-[10px] border text-[0.65rem] font-semibold text-muted-foreground",
            !state.motif ? "border-2 border-primary bg-accent text-primary" : "border-border bg-secondary",
          )}
        >
          None
        </button>
        {MOTIFS.map((m) => {
          const on = state.motif === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              title={m.name}
              aria-label={m.name}
              onClick={() => updateState({ motif: m.id })}
              className={cn(
                "grid aspect-square place-items-center overflow-hidden rounded-[10px] border p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-2 border-primary bg-accent" : "border-border bg-secondary hover:border-primary/50",
              )}
            >
              <m.Svg className="h-full w-full" color={on ? "#0d6b4f" : "#6b6f63"} />
            </button>
          );
        })}
      </div>

      </Section>

      <Section title="Background" value={state.bgImage ? "Photo" : state.gradient ? "Gradient" : "None"} defaultOpen={false}>
        <BackgroundField />
      </Section>

      <Section title="Corner radius" value={`${state.radius ?? 0} px`}>
        <RadiusField />
      </Section>

      <Section title="Show on card" value={`${[state.showFasting, state.showArabic, state.showNext, state.showRows.sunrise !== false].filter(Boolean).length} of 4`}>
      <ToggleList>
      <ToggleRow id="show-fasting" checked={state.showFasting} onChange={(v) => updateState({ showFasting: v })}>
        Sehri &amp; Iftar
      </ToggleRow>
      <ToggleRow id="show-arabic" checked={state.showArabic} onChange={(v) => updateState({ showArabic: v })}>
        Arabic prayer names
      </ToggleRow>
      <ToggleRow id="show-next" checked={state.showNext} onChange={(v) => updateState({ showNext: v })}>
        Next-prayer countdown
      </ToggleRow>
      <ToggleRow
        id="show-sunrise"
        checked={state.showRows.sunrise !== false}
        onChange={(v) => updateState({ showRows: { ...state.showRows, sunrise: v } })}
      >
        Sunrise row
      </ToggleRow>
      </ToggleList>
      </Section>

      {withModes && (
        <Section title="Modes" value={modesText(state)}>
          <ToggleList>
          <ToggleRow id="masjid-switch-m" checked={state.masjid} onChange={(v) => updateState({ masjid: v })} hint="Logo, name and address on the card.">
            Masjid mode
          </ToggleRow>
          <ToggleRow
            id="ramadan-switch-m"
            checked={state.ramadan}
            onChange={(v) => {
              setRamadanTouched(true);
              updateState({ ramadan: v });
            }}
            hint="Sehri and Iftar first."
          >
            Ramadan mode
          </ToggleRow>
          </ToggleList>
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function TextPanel() {
  const { state, updateState } = useStudio();
  return (
    <div className="flex flex-col gap-3">
      <Section title="Language" value={`${LANGUAGE_ITEMS[state.lang]} · ${NUMERAL_SHORT[state.numerals]}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lang-select" className="text-xs font-normal text-muted-foreground">
            Card language
          </Label>
          <Select items={LANGUAGE_ITEMS} value={state.lang} onValueChange={(v) => updateState({ lang: v as Lang })}>
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
          <Label htmlFor="numerals-select" className="text-xs font-normal text-muted-foreground">
            Numerals
          </Label>
          <Select items={NUMERAL_ITEMS} value={state.numerals} onValueChange={(v) => updateState({ numerals: v as Lang })}>
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
      </div>

      </Section>

      <Section title={state.masjid ? "Masjid details" : "Your words"} value={wordsText(state)}>
        <PersonalizeFields />
        {!state.masjid && (
          <p className="text-xs text-muted-foreground">
            Making it for a mosque? Turn on <span className="font-semibold text-foreground">Masjid mode</span> in Designs.
          </p>
        )}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function hijriAdjustText(n: number) {
  return n === 0 ? "As calculated" : `${n > 0 ? "+" : "−"}${Math.abs(n)} day${Math.abs(n) > 1 ? "s" : ""}`;
}

function modesText(s: { masjid: boolean; ramadan: boolean }) {
  return [s.masjid && "Masjid", s.ramadan && "Ramadan"].filter(Boolean).join(" · ") || "Off";
}

function wordsText(s: { masjid: boolean; org?: { name?: string }; personal?: { greeting?: string; dua?: string } }) {
  if (s.masjid) return s.org?.name || "Not added";
  return s.personal?.greeting || s.personal?.dua || "Not added";
}

/** Moves every Hijri date a day or two for local moon sighting. */
function HijriAdjustField() {
  const { state, updateState, monthly } = useStudio();
  const n = state.hijriAdjust ?? 0;
  const set = (v: number) => updateState({ hijriAdjust: Math.max(HIJRI_ADJUST_MIN, Math.min(HIJRI_ADJUST_MAX, v)) });
  const iso = monthly?.days.find((d) => d.dateISO.slice(8, 10) === String(state.day).padStart(2, "0"))?.dateISO;
  const h = iso ? hijriFor(iso, n) : null;
  const words = hijriAdjustText(n);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" aria-label="One day earlier" disabled={n <= HIJRI_ADJUST_MIN} onClick={() => set(n - 1)} className="size-10 cursor-pointer">
          <MinusIcon className="size-4" />
        </Button>
        <div className="flex min-h-10 flex-1 flex-col items-center justify-center rounded-md border border-border bg-card px-2 text-center" aria-live="polite">
          <span className="text-sm font-semibold tabular-nums">{words}</span>
          {h && <span className="text-[0.7rem] text-muted-foreground">{`${h.day} ${h.monthName} ${h.year}`}</span>}
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="One day later" disabled={n >= HIJRI_ADJUST_MAX} onClick={() => set(n + 1)} className="size-10 cursor-pointer">
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Moon sighting differs by country. In Bangladesh the date is often one day behind, so try −1. Prayer times don't change.
      </p>
    </div>
  );
}

export function TimesPanel() {
  const { state, updateState } = useStudio();
  return (
    <div className="flex flex-col gap-3">
      <Section title="Calculation" value={`${(state.method ?? "Auto").replace(/([a-z])([A-Z])/g, "$1 $2")} · ${state.madhab === "hanafi" ? "Hanafi" : "Shafi"}`}>
        <CalculationFields />
      </Section>

      <Section title="Hijri date" value={hijriAdjustText(state.hijriAdjust ?? 0)}>
        <HijriAdjustField />
      </Section>

      <Section title="Clock" value={state.hour12 ? "12-hour" : "24-hour"}>
        <ToggleList>
          <ToggleRow id="hour12-switch" checked={state.hour12} onChange={(v) => updateState({ hour12: v })}>
            12-hour clock
          </ToggleRow>
        </ToggleList>
      </Section>

      <Section title="Prayer rows" value={`${PRAYER_ROW_KEYS.filter((k) => state.showRows[k] !== false).length} of ${PRAYER_ROW_KEYS.length}`}>
      <div className="grid grid-cols-3 gap-1.5">
        {PRAYER_ROW_KEYS.map((key) => {
          const shown = state.showRows[key] !== false;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={shown}
              onClick={() => updateState({ showRows: { ...state.showRows, [key]: !shown } })}
              className={cn(
                "flex items-center justify-center min-h-10 cursor-pointer rounded-md border px-2 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
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
      </Section>

      {templateShowsQibla(state) && (
        <Section title="Qibla" value={state.showQibla ? "On card" : "Off"}>
          <ToggleList>
            <ToggleRow id="qibla-switch" checked={state.showQibla} onChange={(v) => updateState({ showQibla: v })} hint="Direction and distance to Makkah.">
              Show Qibla
            </ToggleRow>
          </ToggleList>
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function PlacePanel() {
  return <LocationBar hideLabel />;
}

export function PanelBody({ id, mobile = false }: { id: PanelId; mobile?: boolean }) {
  if (id === "designs") return <DesignsPanel />;
  if (id === "style") return <StylePanel withModes={mobile} />;
  if (id === "text") return <TextPanel />;
  if (id === "times") return <TimesPanel />;
  return <PlacePanel />;
}
