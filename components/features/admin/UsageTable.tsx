"use client";

import { ArrowDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { userLabel } from "@/components/features/admin/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserUsage } from "@/types/admin";

/** Rows shown at first and added by "더 보기"; there can be hundreds of accounts. */
const PAGE_SIZE = 50;

type SortKey = "today" | "week" | "month" | "total" | "createdAt" | "lastRecordedAt";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "today", label: "오늘", numeric: true },
  { key: "week", label: "이번 주", numeric: true },
  { key: "month", label: "이번 달", numeric: true },
  { key: "total", label: "전체", numeric: true },
  { key: "createdAt", label: "처음 사용", numeric: false },
  { key: "lastRecordedAt", label: "마지막 기록", numeric: false },
];

interface UsageTableProps {
  accounts: UserUsage[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

/** Every account's deliveries per period; clicking a row charts that account. */
export function UsageTable({ accounts, selectedId, onSelect }: UsageTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("month");
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
  const sorted = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const x = a[sortKey] ?? "";
        const y = b[sortKey] ?? "";
        // Highest / most recent first; ties keep the newest account on top.
        if (x !== y) return x < y ? 1 : -1;
        return b.id - a.id;
      }),
    [accounts, sortKey],
  );

  if (accounts.length === 0) {
    return <p className="py-10 text-center text-slate-500">아직 사용자가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 pr-3 text-left font-medium">사용자</th>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                aria-sort={sortKey === column.key ? "descending" : "none"}
                className={cn("py-2 px-3 font-medium", column.numeric ? "text-right" : "text-left")}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSortKey(column.key);
                    setShownCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 hover:text-slate-900",
                    sortKey === column.key && "text-slate-900",
                  )}
                >
                  {column.label}
                  {sortKey === column.key ? <ArrowDownIcon className="size-3.5" /> : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, shownCount).map((account) => {
            const selected = account.id === selectedId;
            return (
              <tr
                key={account.id}
                onClick={() => onSelect(selected ? null : account.id)}
                className={cn(
                  "cursor-pointer border-b border-slate-100 hover:bg-brand-lavender-soft",
                  selected && "bg-brand-violet-mist hover:bg-brand-violet-mist",
                )}
              >
                <td className="py-2.5 pr-3">
                  <button
                    type="button"
                    aria-pressed={selected}
                    className="text-left font-medium text-slate-900"
                  >
                    {userLabel(account)}
                  </button>
                </td>
                <td className="px-3 text-right tabular-nums">{account.today}</td>
                <td className="px-3 text-right tabular-nums">{account.week}</td>
                <td className="px-3 text-right tabular-nums">{account.month}</td>
                <td className="px-3 text-right tabular-nums">{account.total}</td>
                <td className="px-3 whitespace-nowrap text-slate-500 tabular-nums">
                  {account.createdAt}
                </td>
                <td className="px-3 whitespace-nowrap text-slate-500 tabular-nums">
                  {account.lastRecordedAt ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length > shownCount ? (
        <div className="flex justify-center pt-3">
          <Button
            variant="outline"
            onClick={() => setShownCount((count) => count + PAGE_SIZE)}
            className="text-slate-600"
          >
            더 보기 ({(sorted.length - shownCount).toLocaleString("ko-KR")}명 남음)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
