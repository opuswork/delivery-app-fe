import { apiRequest } from "@/lib/api-client";
import type { UsageSeriesPoint, UsageSummary, UsageUnit } from "@/types/admin";

export function getUsageSummary(signal?: AbortSignal): Promise<UsageSummary> {
  return apiRequest<UsageSummary>("/admin/usage", { auth: "admin", signal });
}

export function getUsageSeries(
  unit: UsageUnit,
  userId: number | null,
  signal?: AbortSignal,
): Promise<UsageSeriesPoint[]> {
  const params = new URLSearchParams({ unit });
  if (userId !== null) params.set("userId", String(userId));
  return apiRequest<UsageSeriesPoint[]>(`/admin/usage/series?${params}`, {
    auth: "admin",
    signal,
  });
}
