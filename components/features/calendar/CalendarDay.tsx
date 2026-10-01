"use client";

import { useEffect, useRef } from "react";
import type { DayButtonProps } from "react-day-picker";

import { DeliveryBadgeList } from "@/components/features/calendar/DeliveryBadge";
import { useDeliveryCalendar } from "@/components/features/calendar/DeliveryCalendarContext";
import { Button } from "@/components/ui/button";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

function dayNumberColor(weekday: number, isPast: boolean): string {
  if (weekday === 0) return "text-brand-sunday";
  if (weekday === 6) return "text-brand-saturday";
  return isPast ? "text-slate-400" : "text-slate-800";
}

/** Replaces react-day-picker's day button: date number, "오늘" marker and 납품처 badges. */
export function CalendarDay({ day, modifiers, className, ...props }: DayButtonProps) {
  const { byDate, todayKey } = useDeliveryCalendar();
  const ref = useRef<HTMLButtonElement>(null);
  const key = toDateKey(day.date);
  const records = byDate.get(key) ?? [];
  const count = records.length;
  const isToday = key === todayKey;

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      {...props}
      aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일${
        count ? `, 배달 ${count}건: ${records.map((r) => r.company_name || "배달").join(", ")}` : ""
      }`}
      className={cn(
        "flex h-auto min-h-20 w-full flex-col items-center justify-start gap-0.5 rounded-xl border-2 border-transparent px-0 pt-1.5 pb-1 hover:bg-brand-lavender",
        isToday && "border-brand-violet-soft",
        modifiers.selected && "bg-brand-lavender",
        className,
      )}
    >
      <span
        className={cn(
          "text-2xl leading-tight font-bold",
          dayNumberColor(day.date.getDay(), key < todayKey),
        )}
      >
        {day.date.getDate()}
      </span>
      {isToday ? <span className="text-xs font-bold text-brand-violet">오늘</span> : null}
      {/* The selected day shows CalendarCell's "+" button in the badge's place. */}
      {count > 0 && !modifiers.selected ? <DeliveryBadgeList records={records} /> : null}
    </Button>
  );
}
