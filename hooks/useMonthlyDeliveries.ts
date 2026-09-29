"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listDeliveries } from "@/lib/api/deliveries";
import { groupByDeliveryDate, toMonthKey } from "@/lib/date";
import type { DeliveryRecord } from "@/types/delivery";

interface LoadedMonth {
  key: string;
  records: DeliveryRecord[];
  error: string | null;
}

/** Fetches the signed-in user's delivery records for the displayed month. */
export function useMonthlyDeliveries(month: Date) {
  const monthKey = toMonthKey(month);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<LoadedMonth | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${monthKey}#${version}`;
    listDeliveries(monthKey, controller.signal)
      .then((records) => setLoaded({ key: requestKey, records, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "배달 정보를 불러오지 못했습니다.";
        setLoaded({ key: requestKey, records: [], error: message });
      });
    return () => controller.abort();
  }, [monthKey, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const isCurrent = loaded?.key === `${monthKey}#${version}`;
  // Keep showing the previous month's data during a refresh of the same month.
  const visible = loaded && loaded.key.startsWith(`${monthKey}#`) ? loaded : null;
  const byDate = useMemo(
    () => groupByDeliveryDate(visible?.records ?? []),
    [visible],
  );

  return {
    byDate,
    loading: !isCurrent,
    error: isCurrent ? (loaded?.error ?? null) : null,
    refresh,
  };
}
