"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";

import { BADGE_COLORS } from "@/lib/constants/delivery";
import { cn } from "@/lib/utils";

interface BadgeColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Names the 납품처 in screen-reader labels. */
  label?: string;
}

/** Colour dot (inside the 납품처 box) that opens the badge colour palette. */
export function BadgeColorPicker({ value, onChange, label = "납품처" }: BadgeColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        aria-label={`${label} 배지 색상 선택`}
        className="flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className="size-7 rounded-full border-2 border-white shadow-[0_0_0_1.5px_#1e293b]"
          style={{ backgroundColor: value }}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup
            aria-label="배지 색상"
            className="grid grid-cols-6 gap-3 rounded-3xl bg-neutral-800 p-4 shadow-xl outline-none"
          >
            {BADGE_COLORS.map((color) => {
              const selected = color === value.toUpperCase();
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(color);
                    setOpen(false);
                  }}
                  className={cn(
                    "size-10 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-white/60",
                    selected && "ring-2 ring-[#F98A1B] ring-offset-3 ring-offset-neutral-800",
                  )}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
