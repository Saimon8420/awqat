import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Segmented } from "@/components/ui/segmented";
import { ImageUploadField } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADIENTS } from "@/graphics/backgrounds";
import { useStudio } from "./context";

type BgType = "none" | "gradient" | "photo";

const TYPE_OPTIONS: { value: BgType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "gradient", label: "Gradient" },
  { value: "photo", label: "Photo" },
];

// value → friendly name so Base UI's Select.Value renders "Twilight" rather
// than the raw id.
const GRADIENT_ITEMS: Record<string, string> = Object.fromEntries(
  GRADIENTS.map((g) => [g.id, g.name]),
);

/**
 * The background source, as one mutually-exclusive choice: None, a Gradient,
 * or a Photo. Previously gradient and photo were two independent controls, and
 * a gradient silently won over an uploaded photo (see DecorLayer) — so a photo
 * upload could vanish with no feedback. Making it a single `Segmented` "Type"
 * picker means only one source is ever active, and the relevant controls
 * (gradient list, or uploader + dim/blur) appear for that choice.
 */
export function BackgroundField() {
  const { state, updateState } = useStudio();

  // Local so choosing "Photo" reveals the uploader before a file is picked —
  // state alone can't tell "photo selected, none uploaded yet" from "none".
  const derived: BgType = state.bgImage ? "photo" : state.gradient ? "gradient" : "none";
  const [type, setType] = useState<BgType>(derived);

  function changeType(next: BgType) {
    setType(next);
    if (next === "none") {
      updateState({ gradient: undefined, bgImage: undefined });
    } else if (next === "gradient") {
      updateState({
        bgImage: undefined,
        bgDim: undefined,
        bgBlur: undefined,
        gradient: state.gradient ?? GRADIENTS[0].id,
      });
    } else {
      // photo: clear the gradient, keep any existing image
      updateState({ gradient: undefined });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Background</Label>
        <Segmented
          aria-label="Background type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={changeType}
        />
      </div>

      {type === "gradient" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gradient-select" className="text-xs font-normal text-muted-foreground">
            Gradient
          </Label>
          <Select
            items={GRADIENT_ITEMS}
            value={state.gradient ?? GRADIENTS[0].id}
            onValueChange={(v) => updateState({ gradient: String(v) })}
          >
            <SelectTrigger id="gradient-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADIENTS.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "photo" && (
        <>
          <ImageUploadField
            id="bg-photo-input"
            label="Upload a background photo"
            previewClassName="h-12 w-20"
            value={state.bgImage}
            onChange={(dataUrl) => updateState({ bgImage: dataUrl })}
            onClear={() => updateState({ bgImage: undefined })}
          />

          {state.bgImage && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bg-dim-slider" className="text-xs font-normal text-muted-foreground">
                    Dim
                  </Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {state.bgDim ?? 55}%
                  </span>
                </div>
                <Slider
                  id="bg-dim-slider"
                  min={0}
                  max={100}
                  value={state.bgDim ?? 55}
                  onValueChange={(v) => updateState({ bgDim: v as number })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bg-blur-slider" className="text-xs font-normal text-muted-foreground">
                    Blur
                  </Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {state.bgBlur ?? 0}px
                  </span>
                </div>
                <Slider
                  id="bg-blur-slider"
                  min={0}
                  max={20}
                  value={state.bgBlur ?? 0}
                  onValueChange={(v) => updateState({ bgBlur: v as number })}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default BackgroundField;
