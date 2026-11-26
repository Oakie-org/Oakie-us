import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Holds unsaved work: a stray click outside no longer closes it. */
  locked?: boolean;
}

/** Modal dialog: a bottom sheet on phones, a centred card from `sm` up. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  locked,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-fade bg-black/40" />
        <DialogPrimitive.Content
          onInteractOutside={(event) => locked && event.preventDefault()}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] animate-pop overflow-y-auto rounded-t-card bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
            "shadow-float sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:border sm:border-line",
            className,
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-sans text-lg">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-ink-soft">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-field text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read by screen readers; the visible heading is part of `children`. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * A panel that slides over the right edge (a tall bottom sheet on phones).
 * Used to peek at something without losing your place in the list behind it.
 */
export function Drawer({
  open,
  onOpenChange,
  label,
  children,
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-fade bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] animate-sheet flex-col overflow-hidden rounded-t-card bg-paper outline-none",
            "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(34rem,calc(100vw-3rem))] sm:animate-drawer sm:rounded-none sm:border-l sm:border-line",
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {label}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DrawerClose = DialogPrimitive.Close;

export const Menu = MenuPrimitive.Root;
export const MenuTrigger = MenuPrimitive.Trigger;

export function MenuContent({
  children,
  align = "end",
}: {
  children: ReactNode;
  align?: "start" | "end";
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align={align}
        sideOffset={8}
        className="z-50 min-w-52 animate-pop rounded-field border border-line bg-surface p-1.5 shadow-float"
      >
        {children}
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  );
}

interface MenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function MenuItem({
  children,
  onSelect,
  danger,
  disabled,
}: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[0.95rem] font-medium outline-none transition-colors",
        "data-highlighted:bg-sunken data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-ink-soft",
        danger && "text-danger [&_svg]:text-danger",
      )}
    >
      {children}
    </MenuPrimitive.Item>
  );
}

export function MenuSeparator() {
  return <MenuPrimitive.Separator className="my-1.5 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <MenuPrimitive.Label className="px-3 py-2 text-sm text-ink-soft">
      {children}
    </MenuPrimitive.Label>
  );
}
