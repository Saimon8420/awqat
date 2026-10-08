import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/image-upload";
import type { StudioState } from "@/lib/state";
import { useStudio } from "./context";
import { DebouncedInput, DebouncedTextarea } from "./DebouncedText";

/**
 * Whether the current card renders the Qibla compass (only the daily cards
 * have room for it). Used to hide the "Show Qibla" toggle on monthly/year,
 * where it would be a dead control.
 */
export function templateShowsQibla(state: StudioState): boolean {
  return state.format === "daily";
}

// Character caps per field, sized to what each slot can show without spilling
// past the poster edge: headline-sized greeting/name stay short; the address,
// tagline and dua get a bit more room (the dua wraps a couple of lines).
const LIMIT = {
  greeting: 48,
  dua: 120,
  name: 40,
  address: 64,
  tagline: 64,
} as const;

// Reuses Input's own styling (see src/components/ui/input.tsx) so a
// multi-line dua/verse field looks consistent even though shadcn's Textarea
// primitive isn't part of this project's component set yet.
const TEXTAREA_CLASS =
  "min-h-16 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Personalization fields for the Text panel. With Masjid mode on it's the
 * organization's branding (logo/name/address/tagline, bound to `state.org.*`);
 * otherwise a personal greeting and dua (bound to `state.personal.*`).
 */
export function PersonalizeFields() {
  const { state, updateState } = useStudio();

  const lane = state.masjid ? "organization" : "personal";

  if (lane === "organization") {
    const org = state.org ?? {};
    return (
      <section className="flex flex-col gap-3" aria-label="Personalize (organization)">
        <Label>Personalize</Label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-logo-input" className="text-xs font-normal text-muted-foreground">
            Logo
          </Label>
          <ImageUploadField
            id="org-logo-input"
            label="Upload a logo"
            value={org.logo}
            onChange={(dataUrl) => updateState({ org: { ...state.org, logo: dataUrl } })}
            onClear={() => updateState({ org: { ...state.org, logo: undefined } })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-name-input" className="text-xs font-normal text-muted-foreground">
            Name
          </Label>
          <DebouncedInput
            id="org-name-input"
            value={org.name ?? ""}
            placeholder="Masjid / organization name"
            maxLength={LIMIT.name}
            onCommit={(v) => updateState((prev) => ({ org: { ...prev.org, name: v } }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-address-input" className="text-xs font-normal text-muted-foreground">
            Address
          </Label>
          <DebouncedInput
            id="org-address-input"
            value={org.address ?? ""}
            placeholder="Street, city"
            maxLength={LIMIT.address}
            onCommit={(v) => updateState((prev) => ({ org: { ...prev.org, address: v } }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-tagline-input" className="text-xs font-normal text-muted-foreground">
            Tagline
          </Label>
          <DebouncedInput
            id="org-tagline-input"
            value={org.tagline ?? ""}
            placeholder="e.g. Serving the community since 1990"
            maxLength={LIMIT.tagline}
            onCommit={(v) => updateState((prev) => ({ org: { ...prev.org, tagline: v } }))}
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
          <DebouncedInput
            id="personal-greeting-input"
            value={personal.greeting ?? ""}
            placeholder="e.g. Ramadan Mubarak!"
            maxLength={LIMIT.greeting}
            onCommit={(v) => updateState((prev) => ({ personal: { ...prev.personal, greeting: v } }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personal-dua-input" className="text-xs font-normal text-muted-foreground">
            Dua / verse
          </Label>
          <DebouncedTextarea
            id="personal-dua-input"
            value={personal.dua ?? ""}
            placeholder="A short dua or verse"
            rows={3}
            maxLength={LIMIT.dua}
            className={TEXTAREA_CLASS}
            onCommit={(v) => updateState((prev) => ({ personal: { ...prev.personal, dua: v } }))}
          />
        </div>
      </section>
    );
  }

  return null;
}

export default PersonalizeFields;
