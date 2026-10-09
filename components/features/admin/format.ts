import type { UsageUnit, UserUsage } from "@/types/admin";

/** Device accounts have no name. */
export function userLabel(user: Pick<UserUsage, "id" | "fullName">): string {
  return user.fullName || `기기 #${user.id}`;
}

/** "2026-10-09" → "10/9". */
export function shortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

/** Axis / tooltip label for a period start (yyyy-mm-dd). */
export function periodLabel(period: string, unit: UsageUnit, long = false): string {
  const [year, month] = period.split("-").map(Number);
  if (unit === "month") return long ? `${year}년 ${month}월` : `${month}월`;
  if (unit === "week") return long ? `${shortDate(period)} 주` : shortDate(period);
  return shortDate(period);
}

export const UNIT_LABEL: Record<UsageUnit, string> = {
  day: "일간",
  week: "주간",
  month: "월간",
};

export const UNIT_RANGE: Record<UsageUnit, string> = {
  day: "최근 30일",
  week: "최근 12주",
  month: "최근 12개월",
};
