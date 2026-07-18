/**
 * The data-honesty disclaimer and the cross-tool links, shared by the desktop
 * footer strip and the mobile "About" sheet so the two can never drift.
 */

const TOOLKIT_LINKS: { href: string; label: string }[] = [
  { href: "https://miqaat-dev.vercel.app", label: "Miqaat API" },
  { href: "https://swelter-dev.vercel.app", label: "Swelter" },
  { href: "https://declino.vercel.app", label: "Declino" },
  { href: "https://tessera-zeta-dev.vercel.app", label: "Tessera" },
];

export function DisclaimerText({ className }: { className?: string }) {
  return (
    <p className={className}>
      Times are computed from the Miqaat API — verify with your local authority before relying on
      them for worship.
    </p>
  );
}

export function ToolkitLinks({ className }: { className?: string }) {
  return (
    <footer className={className}>
      <span>Built on the same toolkit:</span>
      {TOOLKIT_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {l.label}
        </a>
      ))}
    </footer>
  );
}
