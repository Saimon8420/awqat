import { useRef, type ChangeEvent } from "react";
import { ImagePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ImageUploadFieldProps = {
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
  id?: string;
  label?: string;
  accept?: string;
  previewClassName?: string;
};

/**
 * A shadcn-styled image picker used wherever the studio takes an uploaded
 * image (background photo, org logo). Replaces the raw native
 * `<input type="file">` — that browser widget ("Choose File / No file
 * chosen") looks out of place and can't be styled to match the rest of the
 * controls.
 *
 * Empty: a dashed outline button that opens the hidden file input.
 * Filled: a thumbnail preview with Replace / Remove actions.
 *
 * The FileReader → data-URL conversion lives here so callers only deal in
 * `value`/`onChange`/`onClear` and never touch the DOM input directly.
 */
export function ImageUploadField({
  value,
  onChange,
  onClear,
  id,
  label = "Upload image",
  accept = "image/*",
  previewClassName,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
    // Let the same file be picked again after a clear.
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />
      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt=""
            className={cn(
              "h-12 w-12 rounded-md border border-border object-cover",
              previewClassName,
            )}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full justify-start gap-2 border-dashed text-muted-foreground"
        >
          <ImagePlusIcon className="size-4" />
          {label}
        </Button>
      )}
    </div>
  );
}

export default ImageUploadField;
