import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { templatesFor, type TemplateDef } from "@/templates/registry";
import { useStudio } from "./context";

const LANES: { value: TemplateDef["lane"]; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "organization", label: "Organization" },
];

/**
 * The sidebar's template gallery: templates for the active `state.format`,
 * grouped into Personal / Organization tabs. Clicking a template selects
 * it via `updateState({ template })`.
 */
export function TemplateGallery() {
  const { state, updateState } = useStudio();

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
                  onClick={() => updateState({ template: t.id })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors",
                    state.template === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <span className="flex aspect-[9/16] w-full items-center justify-center rounded-md bg-muted text-[10px] font-medium uppercase tracking-wide">
                    {t.name.slice(0, 1)}
                  </span>
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
