"use client";

import { createContext, useContext } from "react";

import type { DeliveriesByDate } from "@/types/delivery";

interface DeliveryCalendarContextValue {
  byDate: DeliveriesByDate;
  /** yyyy-mm-dd of the current local day. */
  todayKey: string;
}

/**
 * Lets the day-cell component (rendered by react-day-picker, not by us)
 * read delivery data without redefining components on every render.
 */
export const DeliveryCalendarContext =
  createContext<DeliveryCalendarContextValue | null>(null);

export function useDeliveryCalendar(): DeliveryCalendarContextValue {
  const value = useContext(DeliveryCalendarContext);
  if (!value) throw new Error("CalendarDay must be rendered inside DeliveryCalendar");
  return value;
}
