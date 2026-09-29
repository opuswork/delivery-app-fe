import type { DeliveriesByDate, DeliveryRecord } from "@/types/delivery";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local calendar date → yyyy-mm-dd (no UTC conversion). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Local calendar date → yyyy-mm. */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/** True when the string is yyyy-mm-dd AND a real calendar date. */
export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function groupByDeliveryDate(
  records: readonly DeliveryRecord[],
): DeliveriesByDate {
  const grouped = new Map<string, DeliveryRecord[]>();
  for (const record of records) {
    const list = grouped.get(record.delivery_date);
    if (list) list.push(record);
    else grouped.set(record.delivery_date, [record]);
  }
  return grouped;
}

/** 2026-09-30 → "9월 30일" */
export function formatDateKeyKo(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${m}월 ${d}일`;
}
