import { useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  DownloadIcon,
  InfoIcon,
  LayoutTemplateIcon,
  MapPinIcon,
  PaletteIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { LocationBar } from "./LocationBar";
import { FormatTabs } from "./FormatTabs";
import { DateControls } from "./DateControls";
import { TemplateGallery } from "./TemplateGallery";
import { CustomizePanel } from "./CustomizePanel";
import { ExportBar } from "./ExportBar";
import { DisclaimerText, ToolkitLinks } from "./SiteNotes";
import { useStudio } from "./context";

type Panel = "location" | "date" | "template" | "style" | "export" | "about";

const PANEL_META: Record<Panel, { title: string; description?: string }> = {
  location: { title: "Location", description: "Times are calculated for this place." },
  date: { title: "Date" },
  template: { title: "Template", description: "Pick a layout for this format." },
  style: { title: "Customize", description: "Every change previews instantly." },
  export: { title: "Export", description: "What you see is what downloads." },
  about: { title: "About Awqat" },
};

const TABS: { panel: Panel; label: string; Icon: typeof CalendarDaysIcon }[] = [
  { panel: "date", label: "Date", Icon: CalendarDaysIcon },
  { panel: "template", label: "Template", Icon: LayoutTemplateIcon },
  { panel: "style", label: "Style", Icon: PaletteIcon },
];

const TRIGGER_DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/**
 * The phone layout.
 *
 * The desktop studio is three columns of controls around a preview; stacking
 * those columns vertically buries the preview — the whole point of the app —
 * under screens of form fields. So on mobile the preview *is* the screen: a
 * full-bleed canvas between a slim context bar (brand · place · format) and a
 * bottom tab bar, with every controls panel reachable one tap away in a
 * bottom sheet. Same components, same state — only the shell differs.
 */
export function MobileStudio({ children }: { children: ReactNode }) {
  const { state } = useStudio();
  const [panel, setPanel] = useState<Panel | null>(null);

  const selectedDate = new Date(state.year, state.month - 1, state.day);

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar px-3 pt-2 pb-2.5">
        <div className="flex items-center gap-2">
          <Brand />

          <div className="ml-auto flex items-center gap-1">
            {/* The place chip doubles as the label and the way in — no
                separate "Location" field competing with the canvas. */}
            <button
              type="button"
              onClick={() => setPanel("location")}
              className="flex max-w-[10rem] items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{state.city}</span>
            </button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="About Awqat"
              onClick={() => setPanel("about")}
            >
              <InfoIcon />
            </Button>
          </div>
        </div>

        <FormatTabs />
      </header>

      {/* The hero: the canvas gets every pixel that isn't chrome. */}
      <main id="preview-region" className="relative min-h-0 flex-1 overflow-hidden bg-muted/30">
        {children}
      </main>

      <nav
        aria-label="Studio panels"
        className="flex shrink-0 items-stretch gap-1 border-t border-border bg-sidebar px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {TABS.map(({ panel: p, label, Icon }) => {
          const active = panel === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPanel(p)}
              aria-expanded={active}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {/* The date tab shows the day it will act on, so the canvas
                  doesn't have to be read to know what's selected. */}
              {p === "date" && state.format === "daily"
                ? TRIGGER_DATE.format(selectedDate)
                : label}
            </button>
          );
        })}

        <Button
          type="button"
          size="sm"
          onClick={() => setPanel("export")}
          className="awqat-shimmer my-0.5 h-auto flex-1 flex-col gap-0.5 px-1 py-1.5 text-[11px] font-medium"
        >
          <DownloadIcon className="size-5" />
          Export
        </Button>
      </nav>

      <Sheet open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        {panel && (
          <SheetContent
            title={PANEL_META[panel].title}
            description={PANEL_META[panel].description}
          >
            {panel === "location" && <LocationBar hideLabel />}
            {panel === "date" && <DateControls inline />}
            {panel === "template" && <TemplateGallery />}
            {/* The customize panel carries its own heading on desktop; the
                sheet header already says "Customize", so it's suppressed. */}
            {panel === "style" && <CustomizePanel hideHeading />}
            {panel === "export" && <ExportBar variant="sheet" />}
            {panel === "about" && (
              <div className="flex flex-col gap-3 pb-2 text-xs text-muted-foreground">
                <DisclaimerText />
                <ToolkitLinks className="flex flex-wrap items-center gap-x-3 gap-y-1" />
              </div>
            )}
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

export default MobileStudio;
