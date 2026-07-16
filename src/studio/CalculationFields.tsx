import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getMethods } from "@/lib/miqaat";
import { useStudio } from "./context";

/**
 * How the times themselves are computed: the prayer-time calculation method
 * and the Asr madhab.
 *
 * These used to hide behind an "Advanced" popover attached to the location
 * field. They aren't about *where* you are, though — they're settings that
 * reshape the timetable, so they live alongside the other timetable controls
 * (rows, clock, numerals) in the customize panel.
 */
export function CalculationFields() {
  const { state, updateState, setMethodOverridden } = useStudio();
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([]);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  useEffect(() => {
    getMethods()
      .then(setMethods)
      .catch((err: unknown) => {
        setMethodsError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="method-select">Calculation method</Label>
        <Select
          items={Object.fromEntries(methods.map((m) => [m.id, m.name]))}
          value={state.method}
          onValueChange={(value) => {
            // A manual pick pins the method, so changing city no longer
            // re-derives it from the new country (see LocationBar.selectCity).
            setMethodOverridden(true);
            updateState({ method: String(value) });
          }}
        >
          <SelectTrigger id="method-select" className="w-full">
            <SelectValue placeholder="Select a method" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {methodsError && (
          <p className="text-xs text-destructive" role="alert">
            {methodsError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="madhab-switch">Hanafi Asr timing</Label>
        <Switch
          id="madhab-switch"
          checked={state.madhab === "hanafi"}
          onCheckedChange={(checked) => updateState({ madhab: checked ? "hanafi" : "shafi" })}
        />
      </div>
    </section>
  );
}

export default CalculationFields;
