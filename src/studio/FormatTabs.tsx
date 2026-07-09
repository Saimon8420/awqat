import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { templatesFor } from "@/templates/registry";
import type { StudioState } from "@/lib/state";
import { useStudio } from "./Studio";

const FORMATS: { value: StudioState["format"]; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "year", label: "Year" },
];

export function FormatTabs() {
  const { state, updateState } = useStudio();

  function changeFormat(format: StudioState["format"]) {
    const options = templatesFor(format);
    updateState({
      format,
      template: options.length > 0 ? options[0].id : state.template,
    });
  }

  return (
    <Tabs
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
