import { useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  InfoIcon,
  LayoutTemplateIcon,
  LinkIcon,
  MapPinIcon,
  MinusIcon,
  MoonStarIcon,
  PaletteIcon,
  PlusIcon,
  RotateCcwIcon,
  TypeIcon,
} from "lucide-react";
import { hijriMonthShort } from "@/templates/designs/common";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { FormatTabs } from "./FormatTabs";
import { DateControls } from "./DateControls";
import { LocationBar } from "./LocationBar";
import { ExportBar, useExporter } from "./ExportBar";
import { NowChip } from "./PrayerNowCard";
import { DesignStrip } from "./DesignStrip";
import { DisclaimerText, ToolkitLinks } from "./SiteNotes";
import { PANEL_META, PanelBody, type PanelId } from "./panels";
import { useStudio } from "./context";

const RAIL: { id: PanelId; label: string; Icon: typeof PaletteIcon }[] = [
  { id: "designs", label: "Designs", Icon: LayoutTemplateIcon },
  { id: "style", label: "Style", Icon: PaletteIcon },
  { id: "text", label: "Text", Icon: TypeIcon },
  { id: "times", label: "Times", Icon: ClockIcon },
  { id: "place", label: "Place", Icon: MapPinIcon },
];

const DAY_FMT = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

/** What the date chip reads: the day for Daily, the month for Monthly, the year for Year. */
export function dateChipLabel(format: string, year: number, month: number, day: number): string {
  if (format === "year") return String(year);
  if (format === "monthly") return MONTH_FMT.format(new Date(year, month - 1, 1));
  return DAY_FMT.format(new Date(year, month - 1, day));
}

export function Chip({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[0.82rem] font-semibold outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function ZoomControl() {
  const { zoom, setZoom } = useStudio();
  return (
    <div className="absolute right-4 bottom-3.5 z-10 flex items-center gap-0.5 rounded-[10px] border border-border bg-card p-1 text-xs font-bold shadow-sm">
      <button type="button" aria-label="Zoom out" className="rounded-md p-1.5 hover:bg-secondary disabled:opacity-40" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - 0.5))}>
        <MinusIcon className="size-3.5" />
      </button>
      <button type="button" className="rounded-md px-2 py-1 hover:bg-secondary" onClick={() => setZoom(1)}>
        {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
      </button>
      <button type="button" aria-label="Zoom in" className="rounded-md p-1.5 hover:bg-secondary disabled:opacity-40" disabled={zoom >= 3} onClick={() => setZoom(Math.min(3, zoom + 0.5))}>
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * The desktop studio: the card is the hero in the middle. A slim icon rail
 * opens ONE settings panel at a time, a strip of real mini cards along the
 * bottom picks the design, and place / date / format / download live in the
 * top bar.
 */
export function DesktopStudio({ children }: { children: ReactNode }) {
  const { state, updateState, setRamadanTouched, monthly } = useStudio();
  const [panel, setPanel] = useState<PanelId>("style");
  const [copied, setCopied] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const exporter = useExporter();

  const hijri = state.format === "daily" ? monthly?.days.find((d) => Number(d.dateISO.slice(8, 10)) === state.day)?.hijri : undefined;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: nothing to do
    }
  };
  const resetStyle = () =>
    updateState({ accent: "", motif: undefined, gradient: undefined, bgImage: undefined, bgDim: undefined, bgBlur: undefined, radius: undefined });

  return (
    <div className="grid h-svh grid-cols-[76px_340px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)_118px] overflow-hidden bg-[#f6f2e9] text-foreground">
      {/* Top bar: who / what card / format / live status + download */}
      <header className="col-span-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b border-border bg-[#fffdf8] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center border-r border-border pr-4">
            <Brand compact />
          </div>
          {/* Place and date: one pill, two halves */}
          <div role="group" aria-label="Card place and date" className="flex h-10 min-w-0 items-stretch overflow-hidden rounded-full border border-border bg-[#f6f2e9]">
            <Popover open={placeOpen} onOpenChange={setPlaceOpen}>
              <PopoverTrigger
                render={<button type="button" aria-label={`Place: ${state.city}`} className="flex min-w-0 cursor-pointer items-center gap-2 px-3.5 text-sm font-semibold outline-none transition-colors hover:bg-[#ece5d6] focus-visible:bg-[#ece5d6]" />}
              >
                <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="max-w-[10rem] whitespace-nowrap">{state.city}</span>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                <LocationBar hideLabel />
              </PopoverContent>
            </Popover>
            <span className="w-px shrink-0 bg-border" aria-hidden="true" />
            <Popover>
              <PopoverTrigger
                render={<button type="button" aria-label="Date" className="flex min-w-0 cursor-pointer items-center gap-2 px-3.5 text-sm font-semibold outline-none transition-colors hover:bg-[#ece5d6] focus-visible:bg-[#ece5d6]" />}
              >
                <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-nowrap">{dateChipLabel(state.format, state.year, state.month, state.day)}</span>
                {hijri && (
                  <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap text-primary 2xl:inline">
                    {hijri.day} {hijriMonthShort(hijri.monthName)}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto min-w-64 p-3">
                <DateControls inline />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <FormatTabs className="w-[13.5rem] 2xl:w-[17rem]" />

        <div className="flex min-w-0 items-center justify-end gap-2">
          <NowChip className="hidden min-w-0 xl:inline-flex" />
          <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" aria-label="About Awqat" className="size-10" />}>
              <InfoIcon />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 text-xs">
              <p className="font-serif text-base font-semibold text-foreground">About Awqat</p>
              <DisclaimerText />
              <ToolkitLinks />
            </PopoverContent>
          </Popover>
          {/* One download button; the arrow holds PDF, all months and the options */}
          <div className="awqat-shimmer flex h-10 shrink-0 overflow-hidden rounded-[11px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.18)]">
            <button
              type="button"
              onClick={exporter.handleDownload}
              disabled={exporter.busy}
              className="flex cursor-pointer items-center gap-2 px-4 text-sm font-bold outline-none transition-colors hover:bg-black/10 focus-visible:bg-black/15 disabled:cursor-wait disabled:opacity-70"
            >
              <DownloadIcon className="size-4" />
              {exporter.downloading ? "Saving…" : "Download PNG"}
            </button>
            <Popover>
              <PopoverTrigger
                render={<button type="button" aria-label="More download options" className="flex cursor-pointer items-center border-l border-white/25 px-2.5 outline-none transition-colors hover:bg-black/10 focus-visible:bg-black/15" />}
              >
                <ChevronDownIcon className="size-4" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="font-serif text-base font-semibold">Download</p>
                <p className="-mt-1.5 text-xs text-muted-foreground">What you see is what downloads.</p>
                <ExportBar variant="sheet" />
                <Button type="button" variant="outline" className="w-full gap-2" onClick={copyLink}>
                  {copied ? <CheckIcon /> : <LinkIcon />}
                  {copied ? "Link copied" : "Copy link to this card"}
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Icon rail */}
      <nav aria-label="Studio panels" className="row-span-2 flex flex-col gap-1 border-r border-border bg-[#fffdf8] px-2 pt-2.5 pb-3">
        {RAIL.map(({ id, label, Icon }) => {
          const on = panel === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setPanel(id)}
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-1 rounded-xl py-2.5 text-[0.7rem] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {on && <span aria-hidden="true" className="absolute top-3 bottom-3 -left-2 w-[3px] rounded-r-full bg-primary" />}
              <Icon className="size-5" />
              {label}
            </button>
          );
        })}
        <span className="flex-1" />
        <button
          type="button"
          aria-pressed={state.ramadan}
          title="Ramadan mode: Sehri and Iftar first"
          onClick={() => {
            setRamadanTouched(true);
            updateState({ ramadan: !state.ramadan });
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-xl py-2.5 text-[0.7rem] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            state.ramadan ? "bg-[#c9a24b]/15 text-[#8a6a1f]" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <MoonStarIcon className="size-5" />
          Ramadan
        </button>
      </nav>

      {/* The one open panel */}
      <aside aria-label={PANEL_META[panel].title} className="row-span-2 flex min-h-0 flex-col border-r border-border bg-[#fffdf8]">
        <div className="border-b border-border/60 px-5 pt-5 pb-3.5">
          <h2 className="font-serif text-xl font-semibold">{PANEL_META[panel].title}</h2>
          <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{PANEL_META[panel].hint}</p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-3.5 pt-3.5 pb-6 [scrollbar-width:thin]">
          <PanelBody id={panel} />
        </div>
        {panel === "style" && (
          <div className="flex gap-2 border-t border-border/60 px-3.5 py-3">
            <Button type="button" variant="outline" className="h-10 flex-1 gap-1.5" onClick={resetStyle}>
              <RotateCcwIcon />
              Reset style
            </Button>
            <Button type="button" variant="outline" className="h-10 flex-1 gap-1.5" onClick={copyLink}>
              {copied ? <CheckIcon /> : <LinkIcon />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        )}
      </aside>

      {/* Canvas */}
      <main
        id="preview-region"
        className="relative min-h-0 overflow-hidden"
        style={{ background: "radial-gradient(circle at 1px 1px, #ddd5c3 1px, transparent 0) 0 0/18px 18px" }}
      >
        {children}
        <ZoomControl />
      </main>

      {/* Design strip */}
      <div className="flex min-w-0 items-center gap-3 border-t border-border bg-[#fffdf8] px-4">
        <span className="shrink-0 rotate-180 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground [writing-mode:vertical-rl]">
          Designs
        </span>
        <DesignStrip className="min-w-0 flex-1" />
      </div>
    </div>
  );
}

export default DesktopStudio;
