"use client";

import { useState } from "react";

import { periodLabel } from "@/components/features/admin/format";
import { cn } from "@/lib/utils";
import type { UsageSeriesPoint, UsageUnit } from "@/types/admin";

const PLOT_HEIGHT = 180;
const TICK_COUNT = 4;

/** Rounds the axis top up to 1 / 2 / 5 × 10ⁿ per tick, so ticks are clean numbers. */
function niceMax(max: number): number {
  if (max <= TICK_COUNT) return TICK_COUNT;
  const rough = max / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= rough)! * magnitude;
  return step * TICK_COUNT;
}

/** Which periods get an axis label, so labels never crowd. */
function labelEvery(unit: UsageUnit, count: number): number {
  if (unit === "day") return 5;
  if (unit === "week") return 2;
  return count > 12 ? 2 : 1;
}

interface UsageChartProps {
  points: UsageSeriesPoint[];
  unit: UsageUnit;
}

/**
 * Deliveries recorded per period: one series, so one colour and no legend
 * (the card title names it). The number of people who recorded is in the
 * tooltip rather than on a second axis.
 */
export function UsageChart({ points, unit }: UsageChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...points.map((point) => point.deliveries)));
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (max / TICK_COUNT) * i);
  const every = labelEvery(unit, points.length);
  const last = points.length - 1;
  const shown = active === null ? null : points[active];

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* y-axis ticks */}
        <div
          className="relative w-8 shrink-0 text-right text-xs text-slate-400 tabular-nums"
          style={{ height: PLOT_HEIGHT }}
          aria-hidden
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: PLOT_HEIGHT - (tick / max) * PLOT_HEIGHT }}
            >
              {tick.toLocaleString("ko-KR")}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {/* gridlines: hairline, solid, recessive */}
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 h-px bg-slate-200"
                style={{ top: PLOT_HEIGHT - (tick / max) * PLOT_HEIGHT }}
                aria-hidden
              />
            ))}
            <ol className="absolute inset-0 flex items-end" onMouseLeave={() => setActive(null)}>
              {points.map((point, index) => {
                const height = (point.deliveries / max) * PLOT_HEIGHT;
                const label = periodLabel(point.period, unit, true);
                return (
                  // The whole column is the hover target, not just the bar.
                  <li
                    key={point.period}
                    tabIndex={0}
                    aria-label={`${label}: ${point.deliveries}건, ${point.activeUsers}명 기록`}
                    className="flex h-full flex-1 cursor-default items-end justify-center px-px outline-none"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                  >
                    <div
                      className={cn(
                        "w-full max-w-6 rounded-t bg-brand-violet transition-opacity",
                        active !== null && active !== index && "opacity-40",
                      )}
                      style={{ height: point.deliveries > 0 ? Math.max(height, 2) : 0 }}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          {/* x-axis labels */}
          <div className="mt-2 flex text-xs text-slate-500" aria-hidden>
            {points.map((point, index) => (
              <span key={point.period} className="flex-1 overflow-visible text-center whitespace-nowrap">
                {(last - index) % every === 0 ? periodLabel(point.period, unit) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {shown ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: `calc(2.5rem + (100% - 2.5rem) * ${(active! + 0.5) / points.length})`,
            transform: `translateX(${active! > points.length / 2 ? "-105%" : "5%"})`,
          }}
          role="status"
        >
          <p className="font-medium">{periodLabel(shown.period, unit, true)}</p>
          <p className="mt-0.5 tabular-nums">기록 {shown.deliveries.toLocaleString("ko-KR")}건</p>
          <p className="tabular-nums text-slate-300">
            기록한 사용자 {shown.activeUsers.toLocaleString("ko-KR")}명
          </p>
        </div>
      ) : null}
    </div>
  );
}
