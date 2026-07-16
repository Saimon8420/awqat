import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { templatesFor, type TemplateDef } from "@/templates/registry";
import { useStudio } from "./context";

const LANES: { value: TemplateDef["lane"]; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "organization", label: "Organization" },
];

/**
 * A small designed mini-mock standing in for each template — a gold-on-navy
 * card whose interior schematic (chips + rows / a table / a month grid) hints
 * at the template's format, so the gallery reads as a set of layouts rather
 * than a grid of gray boxes with a letter.
 */
function TemplateThumb({ format }: { format: TemplateDef["format"] }) {
  return (
    <span className="relative flex aspect-[4/5] w-full flex-col gap-1 overflow-hidden rounded-md bg-gradient-to-br from-[#16295c] to-[#0a1330] p-2">
      {/* Mihrab-arch watermark */}
      <svg
        viewBox="0 0 40 50"
        className="pointer-events-none absolute inset-x-0 top-1 mx-auto h-[85%] w-[70%] opacity-25"
        fill="none"
        stroke="#e6c976"
        strokeWidth="1"
        aria-hidden="true"
      >
        <path d="M6 50 V20 C6 12 12 8 20 4 C28 8 34 12 34 20 V50" />
      </svg>

      {format === "daily" && (
        <span className="relative flex h-full flex-col justify-between">
          <span className="h-1 w-2/3 rounded-full bg-[#e6c976]/80" />
          <span className="flex gap-1">
            <span className="h-4 flex-1 rounded-sm bg-white/15" />
            <span className="h-4 flex-1 rounded-sm bg-white/15" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="h-0.5 w-full rounded-full bg-white/25" />
            <span className="h-0.5 w-4/5 rounded-full bg-white/25" />
          </span>
        </span>
      )}

      {format === "monthly" && (
        <span className="relative flex h-full flex-col gap-[3px] pt-2">
          <span className="mb-0.5 h-1 w-1/2 rounded-full bg-[#e6c976]/80" />
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-0.5 w-full rounded-full bg-white/25" />
          ))}
        </span>
      )}

      {format === "year" && (
        <span className="relative grid h-full grid-cols-3 grid-rows-4 gap-[3px] pt-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="rounded-[2px] bg-white/15" />
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * The sidebar's template gallery: templates for the active `state.format`,
 * grouped into Personal / Organization tabs. Clicking a template selects
 * it via `updateState({ template })`.
 */
export function TemplateGallery() {
  const { state, updateState, setTemplateTouched } = useStudio();

  function pickTemplate(id: string) {
    updateState({ template: id });
    // A manual pick from the gallery — remember it so the Ramadan
    // auto-suggest (see Studio.tsx) never overrides an explicit choice.
    setTemplateTouched(true);
  }

  const byLane: Record<TemplateDef["lane"], TemplateDef[]> = {
    personal: templatesFor(state.format, "personal"),
    organization: templatesFor(state.format, "organization"),
  };

  const activeLane: TemplateDef["lane"] = byLane.personal.some((t) => t.id === state.template)
    ? "personal"
    : byLane.organization.some((t) => t.id === state.template)
      ? "organization"
      : byLane.personal.length > 0
        ? "personal"
        : "organization";

  return (
    // Remounts (via `key`) when the format changes so the default active
    // lane is re-derived instead of sticking to a lane that no longer
    // contains the current template.
    <Tabs key={state.format} defaultValue={activeLane} className="flex flex-col gap-2">
      <TabsList className="w-full">
        {LANES.map((l) => (
          <TabsTrigger key={l.value} value={l.value} className="flex-1">
            {l.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {LANES.map((l) => (
        <TabsContent key={l.value} value={l.value}>
          {byLane[l.value].length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No {l.label.toLowerCase()} templates for this format yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {byLane[l.value].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={state.template === t.id}
                  onClick={() => pickTemplate(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    state.template === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <TemplateThumb format={t.format} />
                  <span className="line-clamp-1 w-full text-center">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default TemplateGallery;
