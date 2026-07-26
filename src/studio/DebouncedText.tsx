import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Local-echo + debounced-commit text fields for the personalize panel.
 *
 * Typing updates a local mirror instantly (only the field itself re-renders),
 * while the committed value — which drives the heavy live poster re-render — is
 * written on a short idle. So holding down a key or typing fast no longer janks
 * against a full template repaint on every keystroke. `maxLength` is enforced
 * natively (the browser refuses input past it) and surfaced with a small
 * counter, so personalize text can't run off the edge of the canvas.
 */

const COMMIT_MS = 180;

function useDebouncedCommit(value: string, onCommit: (v: string) => void) {
  const [local, setLocal] = useState(value);
  // The value we most recently pushed up. Lets an incoming `value` prop that is
  // merely the echo of our own commit pass without disturbing the field, while
  // a genuine external change (template/lane switch, reset) still syncs in.
  const committedRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const change = (next: string) => {
    setLocal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      committedRef.current = next;
      onCommit(next);
    }, COMMIT_MS);
  };

  return { local, change };
}

function Counter({ len, max }: { len: number; max: number }) {
  // Stays out of the way until the field is in use, so a panel of empty
  // personalize fields isn't littered with "0/48" chips on load.
  if (len === 0) return null;
  return (
    <span
      className={cn(
        "self-end text-[0.65rem] tabular-nums",
        len >= max ? "font-medium text-primary" : "text-muted-foreground/70",
      )}
      aria-hidden="true"
    >
      {len}/{max}
    </span>
  );
}

type DebouncedInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onCommit: (v: string) => void;
  maxLength: number;
};

export function DebouncedInput({ value, onCommit, maxLength, ...props }: DebouncedInputProps) {
  const { local, change } = useDebouncedCommit(value, onCommit);
  return (
    <div className="flex flex-col gap-1">
      <Input
        {...props}
        value={local}
        maxLength={maxLength}
        onChange={(e) => change(e.target.value)}
      />
      <Counter len={local.length} max={maxLength} />
    </div>
  );
}

type DebouncedTextareaProps = Omit<ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string;
  onCommit: (v: string) => void;
  maxLength: number;
};

export function DebouncedTextarea({
  value,
  onCommit,
  maxLength,
  ...props
}: DebouncedTextareaProps) {
  const { local, change } = useDebouncedCommit(value, onCommit);
  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...props}
        value={local}
        maxLength={maxLength}
        onChange={(e) => change(e.target.value)}
      />
      <Counter len={local.length} max={maxLength} />
    </div>
  );
}
