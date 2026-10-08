import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StudioState } from "@/lib/state";
import { useStudio } from "./context";

const FORMATS: { value: StudioState["format"]; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "year", label: "Year" },
];

export function FormatTabs({ className }: { className?: string } = {}) {
  const { state, updateState } = useStudio();

  // Designs work across every format, so switching format keeps the look.
  function changeFormat(format: StudioState["format"]) {
    updateState({ format });
  }

  return (
    <Tabs
      className={className}
      value={state.format}
      onValueChange={(value) => changeFormat(value as StudioState["format"])}
    >
      <TabsList className="w-full">
        {FORMATS.map((f) => (
          <TabsTrigger key={f.value} value={f.value} className="flex-1">
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default FormatTabs;
