import { useEffect, useRef, useState } from "react";

/**
 * A control's own fast copy of a value, committed upstream after a short idle.
 *
 * Sliders and the colour picker fire on every pixel of a drag; committing each
 * one re-renders the whole card (and every design thumbnail). The control moves
 * with `draft` instantly; the card updates once the drag pauses, and always
 * gets the final value (pending commits flush on unmount).
 */
export function useDraft<T>(value: T, commit: (v: T) => void, ms = 120) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);
  const pending = useRef<{ v: T } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  // An outside change (design switch, reset) replaces the draft.
  useEffect(() => {
    if (!Object.is(value, committed.current)) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current) {
      committed.current = pending.current.v;
      commitRef.current(pending.current.v);
      pending.current = null;
    }
  };

  useEffect(() => flush, []);

  const change = (v: T) => {
    setDraft(v);
    pending.current = { v };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, ms);
  };

  return [draft, change, flush] as const;
}
