import { useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  DownloadIcon,
  InfoIcon,
  MapPinIcon,
  MinimizeIcon,
  PaletteIcon,
  TypeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { FormatTabs } from "./FormatTabs";
import { DateControls } from "./DateControls";
import { ExportBar } from "./ExportBar";
import { DesignStrip } from "./DesignStrip";
import { DisclaimerText, ToolkitLinks } from "./SiteNotes";
import { PANEL_META, PanelBody, type PanelId } from "./panels";
import { Chip, dateChipLabel } from "./DesktopStudio";
import { useStudio } from "./context";

type Sheet = PanelId | "date" | "download" | "about";

const SHEET_META: Record<Exclude<Sheet, PanelId>, { title: string; hint?: string }> = {
  date: { title: "Date" },
  download: { title: "Download", hint: "What you see is what downloads." },
  about: { title: "About Awqat" },
};

const TABS: { id: PanelId; label: string; Icon: typeof PaletteIcon }[] = [
  { id: "style", label: "Style", Icon: PaletteIcon },
  { id: "text", label: "Text", Icon: TypeIcon },
  { id: "times", label: "Times", Icon: ClockIcon },
  { id: "place", label: "Place", Icon: MapPinIcon },
];

const SHORT_DAY = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/**
 * The phone layout: the card fills the screen between a slim context bar
 * (brand · place · date · format) and the controls. A swipeable strip of real
 * mini cards picks the design; four tools plus a big Download button sit at
 * the thumb, each opening a bottom sheet. Tap the card to zoom in — year
 * posters and landscape tables are far too small to read at fit-to-screen.
 */
export function MobileStudio({ children }: { children: ReactNode }) {
  const { state, zoom, setZoom } = useStudio();
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const meta =
    sheet === null
      ? null
      : sheet in PANEL_META
        ? PANEL_META[sheet as PanelId]
        : SHEET_META[sheet as Exclude<Sheet, PanelId>];

  const dateLabel =
    state.format === "daily"
      ? SHORT_DAY.format(new Date(state.year, state.month - 1, state.day))
      : dateChipLabel(state.format, state.year, state.month, state.day);

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[#f6f2e9] text-foreground">
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-border bg-[#fffdf8] px-3.5 pt-2.5 pb-2.5">
        <div className="flex items-center gap-2">
          <Brand compact />
          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <Chip onClick={() => setSheet("place")} className="px-2.5 py-1 text-xs" aria-label={`Place: ${state.city}`}>
              <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[6.5rem] truncate">{state.city}</span>
            </Chip>
            <Chip onClick={() => setSheet("date")} className="px-2.5 py-1 text-xs" aria-label="Date">
              <CalendarDaysIcon className="size-3.5 shrink-0 text-muted-foreground" />
              {dateLabel}
            </Chip>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="About Awqat" onClick={() => setSheet("about")}>
              <InfoIcon />
            </Button>
          </div>
        </div>
        <FormatTabs />
      </header>

      {/* The hero: the card gets every pixel that isn't chrome. Tap to zoom. */}
      <main
        id="preview-region"
        className="relative min-h-0 flex-1 overflow-hidden"
        onClick={(e) => {
          if (zoom === 1 && (e.target as HTMLElement).closest("#export-node")) setZoom(2);
        }}
      >
        {children}
        {zoom > 1 && (
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-md"
          >
            <MinimizeIcon className="size-3.5" />
            Fit to screen
          </button>
        )}
      </main>

      <div className="shrink-0 border-t border-border bg-[#fffdf8] px-3.5">
        <DesignStrip thumbWidth={44} />
      </div>

      <nav
        aria-label="Studio tools"
        className="grid shrink-0 grid-cols-[repeat(4,1fr)_1.3fr] gap-1 bg-[#fffdf8] px-2.5 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSheet(id)}
            aria-expanded={sheet === id}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.68rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
              sheet === id ? "bg-accent text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSheet("download")}
          className="awqat-shimmer flex flex-col items-center gap-0.5 rounded-[14px] bg-primary py-1.5 text-[0.68rem] font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DownloadIcon className="size-5" />
          Download
        </button>
      </nav>

      <Sheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)}>
        {sheet && meta && (
          <SheetContent title={meta.title} description={meta.hint}>
            {sheet in PANEL_META && <PanelBody id={sheet as PanelId} mobile />}
            {sheet === "date" && <DateControls inline />}
            {sheet === "download" && <ExportBar variant="sheet" />}
            {sheet === "about" && (
              <div className="flex flex-col gap-3 pb-2 text-xs text-muted-foreground">
                <DisclaimerText />
                <ToolkitLinks />
              </div>
            )}
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

export default MobileStudio;
