import { useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  InfoIcon,
  LayoutTemplateIcon,
  MapPinIcon,
  MinusIcon,
  PaletteIcon,
  PlusIcon,
  TypeIcon,
} from "lucide-react";
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
  const { state } = useStudio();
  const [panel, setPanel] = useState<PanelId>("style");
  const [placeOpen, setPlaceOpen] = useState(false);
  const exporter = useExporter();

  return (
    <div className="grid h-svh grid-cols-[72px_300px_minmax(0,1fr)] grid-rows-[60px_minmax(0,1fr)_118px] overflow-hidden bg-[#f6f2e9] text-foreground">
      {/* Top bar */}
      <header className="col-span-3 flex min-w-0 items-center gap-2.5 border-b border-border bg-[#fffdf8] px-4">
        <Brand compact />
        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />

        <Popover open={placeOpen} onOpenChange={setPlaceOpen}>
          <PopoverTrigger render={<Chip aria-label={`Place: ${state.city}`} />}>
            <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="max-w-[11rem] truncate">{state.city}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <LocationBar hideLabel />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger render={<Chip aria-label="Date" />}>
            <CalendarDaysIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{dateChipLabel(state.format, state.year, state.month, state.day)}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto min-w-64 p-3">
            <DateControls inline />
          </PopoverContent>
        </Popover>

        <FormatTabs className="w-[15.5rem] shrink-0" />

        <span className="flex-1" />

        <NowChip className="hidden min-w-0 lg:inline-flex" />

        <Popover>
          <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" aria-label="About Awqat" />}>
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 text-xs">
            <p className="font-serif text-base font-semibold text-foreground">About Awqat</p>
            <DisclaimerText />
            <ToolkitLinks />
          </PopoverContent>
        </Popover>

        <Button type="button" variant="outline" onClick={exporter.handleDownloadPdf} disabled={exporter.busy}>
          {exporter.pdfDownloading ? "Exporting…" : "PDF"}
        </Button>
        <Popover>
          <PopoverTrigger render={<Button type="button" className="awqat-shimmer gap-1.5" />}>
            <DownloadIcon />
            Download
            <ChevronDownIcon className="opacity-70" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="font-serif text-base font-semibold">Download</p>
            <p className="-mt-1.5 text-xs text-muted-foreground">What you see is what downloads.</p>
            <ExportBar variant="sheet" />
          </PopoverContent>
        </Popover>
      </header>

      {/* Icon rail */}
      <nav aria-label="Studio panels" className="row-span-2 flex flex-col items-center gap-1 border-r border-border bg-[#fffdf8] pt-3">
        {RAIL.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={panel === id}
            onClick={() => setPanel(id)}
            className={cn(
              "flex w-14 flex-col items-center gap-1 rounded-xl py-2 text-[0.66rem] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              panel === id ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>

      {/* The one open panel */}
      <aside aria-label={PANEL_META[panel].title} className="row-span-2 flex min-h-0 flex-col border-r border-border bg-[#fffdf8]">
        <div className="px-[18px] pt-[18px] pb-3">
          <h2 className="font-serif text-lg font-semibold">{PANEL_META[panel].title}</h2>
          <p className="text-xs text-muted-foreground">{PANEL_META[panel].hint}</p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-[18px] pb-6">
          <PanelBody id={panel} />
        </div>
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
