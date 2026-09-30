"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "cn"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Popup extends this far below the screen so a swipe up never shows a gap. */
const BLEED = "[--bleed:3rem]"
const EASE = "duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]"

/** A panel that slides up from the bottom; swipe down or tap outside to close. */
function BottomSheet({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="bottom-sheet" swipeDirection="down" {...props} />
}

function BottomSheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    // Keeps focused inputs above the phone's on-screen keyboard.
    <DrawerPrimitive.VirtualKeyboardProvider>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop
          data-slot="bottom-sheet-overlay"
          className={cn(
            "fixed inset-0 z-50 min-h-dvh bg-black/20 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity supports-backdrop-filter:backdrop-blur-xs data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute",
            EASE
          )}
        />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <DrawerPrimitive.Popup
            data-slot="bottom-sheet-content"
            className={cn(
              BLEED,
              EASE,
              "relative -mb-(--bleed) max-h-[calc(90dvh+var(--bleed))] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-popover px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px)+var(--bleed))] text-sm text-popover-foreground shadow-[0_-8px_30px_rgb(0_0_0/0.12)] outline-none touch-auto transition-transform [transform:translateY(var(--drawer-swipe-movement-y))] data-swiping:select-none data-starting-style:[transform:translateY(calc(100%-var(--bleed)+2px))] data-ending-style:[transform:translateY(calc(100%-var(--bleed)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              className
            )}
            {...props}
          >
            <div aria-hidden className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <DrawerPrimitive.Content className="grid gap-4">{children}</DrawerPrimitive.Content>
            {showCloseButton && (
              <DrawerPrimitive.Close
                data-slot="bottom-sheet-close"
                render={
                  <Button variant="ghost" className="absolute top-4 right-3" size="icon-sm" />
                }
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </DrawerPrimitive.Close>
            )}
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.VirtualKeyboardProvider>
  )
}

function BottomSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn("flex flex-col gap-2 pr-8", className)}
      {...props}
    />
  )
}

function BottomSheetTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn("font-heading text-lg leading-none font-bold", className)}
      {...props}
    />
  )
}

function BottomSheetDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
}
