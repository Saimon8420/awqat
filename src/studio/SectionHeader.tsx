import { cn } from "@/lib/utils";

/**
 * The shared sidebar section header — an emerald tick + an uppercase, tracked
 * label over a full-bleed emerald rule. Used for both sidebars' section labels
 * (Location / Date on the left; Style / Format / Times / Personalize on the
 * right) so they read as one system.
 *
 * Full-bleed: `-mx-4` cancels the enclosing aside's `px-4` so the rule spans
 * edge to edge. The border color (and any sticky/elevation classes) come from
 * `className` — the right-hand groups pass a stronger emerald + shadow while
 * pinned; the resting default is a soft `border-primary/70`.
 */
export function SectionHeader({ title, className }: { title: string; className?: string }) {
  return (
    <h3 className={cn("-mx-4 flex items-center gap-2 border-b px-4 py-2", className)}>
      <span className="h-3.5 w-1 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground/75">
        {title}
      </span>
    </h3>
  );
}

export default SectionHeader;
