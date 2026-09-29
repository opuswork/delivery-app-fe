"use client";

import { useMemo } from "react";
import { ko } from "react-day-picker/locale";

import { CalendarDay } from "@/components/features/calendar/CalendarDay";
import { CalendarNav } from "@/components/features/calendar/CalendarNav";
import { DeliveryCalendarContext } from "@/components/features/calendar/DeliveryCalendarContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { addMonths } from "@/lib/date";
import type { DeliveriesByDate } from "@/types/delivery";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface DeliveryCalendarProps {
  month: Date;
  todayKey: string;
  byDate: DeliveriesByDate;
  selectedDate: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function DeliveryCalendar({
  month,
  todayKey,
  byDate,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: DeliveryCalendarProps) {
  const contextValue = useMemo(() => ({ byDate, todayKey }), [byDate, todayKey]);

  return (
    <Card className="rounded-[2rem] bg-white py-6 shadow-sm ring-0">
      <CardContent className="flex flex-col gap-4 px-4">
        <CalendarNav
          month={month}
          onPrevious={() => onMonthChange(addMonths(month, -1))}
          onNext={() => onMonthChange(addMonths(month, 1))}
        />
        <DeliveryCalendarContext.Provider value={contextValue}>
          <Calendar
            mode="single"
            required
            selected={selectedDate}
            onSelect={onSelectDate}
            month={month}
            onMonthChange={onMonthChange}
            locale={ko}
            hideNavigation
            showOutsideDays={false}
            formatters={{ formatWeekdayName: (date) => WEEKDAY_LABELS[date.getDay()] }}
            className="w-full bg-transparent p-0"
            classNames={{
              root: "w-full",
              month_caption: "hidden",
              weekdays: "flex",
              weekday:
                "flex-1 pb-2 text-lg font-bold text-slate-500 first:text-brand-sunday last:text-brand-saturday",
              week: "mt-1 flex w-full",
              day: "flex-1 p-0.5 text-center",
              // CalendarDay draws its own today/selected styling.
              today: "",
            }}
            components={{ DayButton: CalendarDay }}
          />
        </DeliveryCalendarContext.Provider>
      </CardContent>
    </Card>
  );
}
