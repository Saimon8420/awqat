import { useRef, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/templates/registry";
import { useStudio } from "./context";

// Reuses Input's own styling (see src/components/ui/input.tsx) so a
// multi-line dua/verse field looks consistent even though shadcn's Textarea
// primitive isn't part of this project's component set yet.
const TEXTAREA_CLASS =
  "min-h-16 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Lane-aware personalization section, mounted inside `CustomizePanel`.
 * Resolves the active template's lane (`TEMPLATES.find(t => t.id ===
 * state.template)?.lane`) and renders either organization branding fields
 * (logo/name/address/tagline, bound to `state.org.*`) or personal fields
 * (greeting/dua, bound to `state.personal.*`). Renders nothing if the
 * template can't be resolved (defensive; `withValidTemplate` in Studio keeps
 * `state.template` valid for the current format in practice).
 */
export function PersonalizeFields() {
  const { state, updateState } = useStudio();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const lane = TEMPLATES.find((t) => t.id === state.template)?.lane;

  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateState({ org: { ...state.org, logo: reader.result } });
      }
    };
    reader.readAsDataURL(file);
    // Allow re-selecting the same file later (e.g. after clearing).
    e.target.value = "";
  }

  if (lane === "organization") {
    const org = state.org ?? {};
    return (
      <section className="flex flex-col gap-3" aria-label="Personalize (organization)">
        <Label>Personalize</Label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-logo-input" className="text-xs font-normal text-muted-foreground">
            Logo
          </Label>
          <input
            ref={logoInputRef}
            id="org-logo-input"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
          />
          {org.logo && (
            <div className="flex items-center gap-2">
              <img src={org.logo} alt="" className="h-10 w-10 rounded-md object-cover" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateState({ org: { ...state.org, logo: undefined } })}
              >
                Clear logo
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-name-input" className="text-xs font-normal text-muted-foreground">
            Name
          </Label>
          <Input
            id="org-name-input"
            value={org.name ?? ""}
            placeholder="Masjid / organization name"
            onChange={(e) => updateState({ org: { ...state.org, name: e.target.value } })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-address-input" className="text-xs font-normal text-muted-foreground">
            Address
          </Label>
          <Input
            id="org-address-input"
            value={org.address ?? ""}
            placeholder="Street, city"
            onChange={(e) => updateState({ org: { ...state.org, address: e.target.value } })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-tagline-input" className="text-xs font-normal text-muted-foreground">
            Tagline
          </Label>
          <Input
            id="org-tagline-input"
            value={org.tagline ?? ""}
            placeholder="e.g. Serving the community since 1990"
            onChange={(e) => updateState({ org: { ...state.org, tagline: e.target.value } })}
          />
        </div>
      </section>
    );
  }

  if (lane === "personal") {
    const personal = state.personal ?? {};
    return (
      <section className="flex flex-col gap-3" aria-label="Personalize (personal)">
        <Label>Personalize</Label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-greeting-input" className="text-xs font-normal text-muted-foreground">
            Greeting
          </Label>
          <Input
            id="personal-greeting-input"
            value={personal.greeting ?? ""}
            placeholder="e.g. Ramadan Mubarak, Ayesha!"
            onChange={(e) =>
              updateState({ personal: { ...state.personal, greeting: e.target.value } })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-dua-input" className="text-xs font-normal text-muted-foreground">
            Dua / verse
          </Label>
          <textarea
            id="personal-dua-input"
            value={personal.dua ?? ""}
            placeholder="A short dua or verse"
            rows={3}
            className={TEXTAREA_CLASS}
            onChange={(e) => updateState({ personal: { ...state.personal, dua: e.target.value } })}
          />
        </div>
      </section>
    );
  }

  return null;
}

export default PersonalizeFields;
