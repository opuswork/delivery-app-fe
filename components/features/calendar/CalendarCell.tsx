"use client";

import { PlusIcon } from "lucide-react";
import type { DayProps } from "react-day-picker";

import { useDeliveryCalendar } from "@/components/features/calendar/DeliveryCalendarContext";
import { Button } from "@/components/ui/button";

/**
 * Replaces react-day-picker's day cell (<td>) so the selected day can show a
 * "+" button next to — not inside — its day button.
 */
export function CalendarCell({ day, modifiers, children, ...props }: DayProps) {
  const { onAdd } = useDeliveryCalendar();

  return (
    <td {...props}>
      {children}
      {modifiers.selected ? (
        <Button
          size="icon-sm"
          aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일 메모 추가`}
          onClick={() => onAdd(day.date)}
          className="absolute bottom-1.5 left-1/2 z-10 size-7 -translate-x-1/2 rounded-full bg-brand-violet text-white shadow-sm hover:bg-brand-violet/90"
        >
          <PlusIcon className="size-4" strokeWidth={3} />
        </Button>
      ) : null}
    </td>
  );
}
