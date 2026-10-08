/**
 * The studio's brand lockup: a gold-on-navy mihrab-arch mark (behind a slow
 * animated halo — see `.awqat-brand-glow` in index.css) beside the Awqat
 * wordmark. `compact` drops the tagline for the slim top bars. Chrome only;
 * never part of an export.
 */
export function Brand({ compact = false }: { compact?: boolean } = {}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span className="awqat-brand-glow inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#132456] to-[#0a1330] ring-1 ring-[#c9a24b]/40">
        <svg viewBox="0 0 40 40" className="size-5" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          {/* Mihrab arch niche */}
          <path d="M11 34 V17 C11 11 15 8 20 5 C25 8 29 11 29 17 V34" stroke="#e6c976" strokeWidth="1.8" strokeLinecap="round" />
          {/* Crescent + star inside the niche */}
          <path d="M22.5 14.5a5 5 0 1 0 0 8 6 6 0 1 1 0-8Z" fill="#e6c976" />
          <path d="M27 15.5l.7 1.6 1.7.2-1.3 1.2.4 1.7-1.5-.9-1.5.9.4-1.7-1.3-1.2 1.7-.2.7-1.6Z" fill="#e6c976" />
        </svg>
      </span>
      <div className="leading-tight">
        <div className="flex items-baseline gap-1.5">
          <h1 className="font-serif text-lg font-semibold tracking-tight text-foreground">Awqat</h1>
          <span className="font-arabic text-lg text-[#9a7b2f]">أوقات</span>
        </div>
        {!compact && <p className="text-xs text-muted-foreground">Prayer &amp; fasting timetables, made to share</p>}
      </div>
    </div>
  );
}

export default Brand;
