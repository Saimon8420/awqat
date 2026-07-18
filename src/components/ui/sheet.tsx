import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * A bottom sheet — the mobile counterpart to the desktop sidebars. Built on
 * the same Base UI Dialog primitive as `dialog.tsx`, but anchored to the
 * bottom edge, capped at a fraction of the viewport, and internally
 * scrollable, so a long controls panel never pushes the canvas off screen.
 */
function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
  className,
  children,
  title,
  description,
  ...props
}: DialogPrimitive.Popup.Props & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-foreground/25 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[82svh] flex-col rounded-t-2xl bg-popover text-popover-foreground shadow-[0_-8px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-border outline-none duration-200",
          "data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className,
        )}
        {...props}
      >
        {/* Grab handle — a purely visual affordance that reads as "this panel
            belongs to the bottom edge and can be dismissed". */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border" />

        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-2 pb-3">
          <div className="min-w-0">
            <DialogPrimitive.Title className="truncate text-sm font-semibold">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="truncate text-xs text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="-mr-1 shrink-0" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
