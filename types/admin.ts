/** Mirrors be/src/admin/dto/usage.dto.ts. Usage = deliveries recorded. */
export interface PeriodUsage {
  deliveries: number;
  activeUsers: number;
}

export interface PeriodSummary extends PeriodUsage {
  newUsers: number;
}

export interface UserUsage {
  id: number;
  /** Empty for device accounts. */
  fullName: string;
  /** Korean time, "yyyy-mm-dd hh:mm". */
  createdAt: string;
  today: number;
  week: number;
  month: number;
  total: number;
  lastRecordedAt: string | null;
}

export interface UsageSummary {
  periodStarts: { today: string; week: string; month: string };
  users: number;
  totalDeliveries: number;
  today: PeriodSummary;
  week: PeriodSummary;
  month: PeriodSummary;
  accounts: UserUsage[];
}

export type UsageUnit = "day" | "week" | "month";

export interface UsageSeriesPoint extends PeriodUsage {
  /** Start of the period, yyyy-mm-dd. */
  period: string;
}
