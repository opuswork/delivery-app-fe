"use client";

import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  shortDate,
  UNIT_LABEL,
  UNIT_RANGE,
  userLabel,
} from "@/components/features/admin/format";
import { UsageChart } from "@/components/features/admin/UsageChart";
import { UsageTable } from "@/components/features/admin/UsageTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getUsageSeries, getUsageSummary } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-client";
import { adminToken } from "@/lib/token";
import { cn } from "@/lib/utils";
import type { UsageSeriesPoint, UsageSummary, UsageUnit } from "@/types/admin";

const UNITS: UsageUnit[] = ["day", "week", "month"];

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "불러오지 못했습니다.";
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

/**
 * How much the app is used, for the "admin" login. Usage = deliveries
 * recorded, by when they were saved, in Korean time.
 */
export function AdminDashboard() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [series, setSeries] = useState<UsageSeriesPoint[] | null>(null);
  const [unit, setUnit] = useState<UsageUnit>("day");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getUsageSummary(controller.signal)
      .then(setSummary)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    getUsageSeries(unit, selectedId, controller.signal)
      .then(setSeries)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [unit, selectedId, refreshKey]);

  const refresh = useCallback(() => {
    setError(null);
    setRefreshKey((key) => key + 1);
  }, []);

  const selected = summary?.accounts.find((account) => account.id === selectedId) ?? null;

  return (
    <main className="min-h-dvh bg-brand-page">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">말로일정 사용 현황</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={refresh} className="gap-1.5 text-slate-600">
              <RefreshCwIcon className="size-4" /> 새로고침
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adminToken.clear()}
              className="text-slate-600"
            >
              로그아웃
            </Button>
          </div>
        </header>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {summary ? (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="요약">
            <StatTile
              label="전체 사용자"
              value={summary.users.toLocaleString("ko-KR")}
              detail={`이번 달 새 사용자 ${summary.month.newUsers}명`}
            />
            <StatTile
              label="오늘 기록"
              value={`${summary.today.deliveries.toLocaleString("ko-KR")}건`}
              detail={`${summary.today.activeUsers}명 기록 · 새 사용자 ${summary.today.newUsers}명`}
            />
            <StatTile
              label="이번 주 기록"
              value={`${summary.week.deliveries.toLocaleString("ko-KR")}건`}
              detail={`${shortDate(summary.periodStarts.week)}(월)부터 · ${summary.week.activeUsers}명 기록`}
            />
            <StatTile
              label="이번 달 기록"
              value={`${summary.month.deliveries.toLocaleString("ko-KR")}건`}
              detail={`${summary.month.activeUsers}명 기록 · 전체 ${summary.totalDeliveries.toLocaleString("ko-KR")}건`}
            />
          </section>
        ) : !error ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6 text-brand-violet" />
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                {selected ? `${userLabel(selected)}의 기록 수` : "전체 기록 수"}
              </h2>
              <p className="text-xs text-slate-500">
                {UNIT_RANGE[unit]} · 저장한 시각 기준
                {selected ? (
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="ml-2 text-brand-violet underline-offset-2 hover:underline"
                  >
                    전체 보기
                  </button>
                ) : null}
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="기간 단위">
              {UNITS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm text-slate-600",
                    unit === option && "bg-white font-medium text-slate-900 shadow-sm",
                  )}
                >
                  {UNIT_LABEL[option]}
                </button>
              ))}
            </div>
          </div>
          {series ? (
            <UsageChart points={series} unit={unit} />
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <Spinner className="size-6 text-brand-violet" />
            </div>
          )}
        </section>

        {summary ? (
          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:p-5">
            <h2 className="font-semibold text-slate-900">사용자별 기록 수</h2>
            <p className="mb-3 text-xs text-slate-500">
              이름이 없는 사용자는 로그인 없이 앱을 쓰는 기기입니다. 줄을 누르면 위 그래프에 그
              사용자의 기록이 보입니다.
            </p>
            <UsageTable
              accounts={summary.accounts}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
