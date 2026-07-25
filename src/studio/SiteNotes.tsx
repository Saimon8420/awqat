import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * The data-honesty disclaimer and the cross-tool links, shared by the desktop
 * footer strip and the mobile "About" sheet so the two can never drift.
 */

const TOOLKIT_LINKS: { href: string; label: string }[] = [
  { href: "https://miqaat-dev.vercel.app", label: "Miqaat API" },
  { href: "https://falah-dev.vercel.app", label: "Falah" },
  { href: "https://swelter-dev.vercel.app", label: "Swelter" },
  { href: "https://declino.vercel.app", label: "Declino" },
  { href: "https://tessera-zeta-dev.vercel.app", label: "Tessera" },
];

export function DisclaimerText({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground", className)}>
      Times are computed from the Miqaat API.
    </p>
  );
}

export function ToolkitLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="text-muted-foreground/80">Built on the same toolkit</span>
      {/* Separators sit only *between* links (not after the label), so the row
          reads as "label: a · b · c" rather than "label · a · b · c". */}
      <span className="flex flex-wrap items-center gap-x-2">
        {TOOLKIT_LINKS.map((l, i) => (
          <Fragment key={l.href}>
            {i > 0 && (
              <span aria-hidden="true" className="text-border">
                ·
              </span>
            )}
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              {l.label}
            </a>
          </Fragment>
        ))}
      </span>
    </div>
  );
}
