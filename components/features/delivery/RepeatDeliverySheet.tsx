"use client";

import { useState } from "react";
import { ko } from "react-day-picker/locale";

import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { repeatDelivery } from "@/lib/api/deliveries";
import { deliveryTypeColor } from "@/lib/constants/delivery";
import {
  addDays,
  formatDateKeyKo,
  fromDateKey,
  isValidDateKey,
  toDateKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import type { DeliveryRecord, RepeatDeliveryResult } from "@/types/delivery";

/** Mirrors the backend limit (about one year). */
const MAX_REPEAT_DATES = 366;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type RepeatMode = "weekly" | "monthly" | "custom";

const MODES: { value: RepeatMode; label: string }[] = [
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "custom", label: "직접 선택" },
];

interface RepeatRule {
  mode: RepeatMode;
  weekdays: ReadonlySet<number>;
  /** yyyy-mm-dd, inclusive */
  endKey: string;
}

/**
 * The same day of the month, `offset` months after `source`. A day the month
 * does not have becomes its last day (31일 → 11월 30일).
 */
function sameDayOfMonth(source: Date, offset: number): Date {
  const year = source.getFullYear();
  const month = source.getMonth() + offset;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(source.getDate(), lastDay));
}

/** Dates after `sourceKey` up to the end date that match the rule ("직접 선택": none). */
function datesForRule(sourceKey: string, rule: RepeatRule): Date[] {
  if (rule.mode === "custom" || !isValidDateKey(rule.endKey)) return [];
  const source = fromDateKey(sourceKey);
  const dates: Date[] = [];
  if (rule.mode === "monthly") {
    for (
      let offset = 1, date = sameDayOfMonth(source, 1);
      toDateKey(date) <= rule.endKey && dates.length < MAX_REPEAT_DATES;
      offset += 1, date = sameDayOfMonth(source, offset)
    ) {
      dates.push(date);
    }
    return dates;
  }
  for (
    let date = addDays(source, 1);
    toDateKey(date) <= rule.endKey && dates.length < MAX_REPEAT_DATES;
    date = addDays(date, 1)
  ) {
    if (rule.weekdays.has(date.getDay())) dates.push(date);
  }
  return dates;
}

/**
 * 매주: the last day of the month after the source's (4–8 weekly repeats).
 * 매월: the last day of the 6th month after it (6 monthly repeats).
 */
function defaultEndKey(sourceKey: string, mode: RepeatMode): string {
  const source = fromDateKey(sourceKey);
  const months = mode === "monthly" ? 7 : 2;
  return toDateKey(new Date(source.getFullYear(), source.getMonth() + months, 0));
}

function resultMessage({ created, skipped_dates }: RepeatDeliveryResult): string {
  const skipped = skipped_dates.length;
  if (created === 0) return "선택한 날짜에 이미 같은 배달이 있습니다.";
  return skipped > 0
    ? `${created}개 날짜에 반복 저장했습니다. (이미 있는 ${skipped}개 날짜는 건너뜀)`
    : `${created}개 날짜에 반복 저장했습니다.`;
}

interface RepeatFormProps {
  source: DeliveryRecord;
  onCancel: () => void;
  onRepeated: (message: string) => void;
}

function RepeatForm({ source, onCancel, onRepeated }: RepeatFormProps) {
  const sourceKey = source.delivery_date;
  const [rule, setRule] = useState<RepeatRule>(() => ({
    mode: "weekly",
    weekdays: new Set([fromDateKey(sourceKey).getDay()]),
    endKey: defaultEndKey(sourceKey, "weekly"),
  }));
  const [selected, setSelected] = useState<Date[]>(() => datesForRule(sourceKey, rule));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Changing a setting recalculates the dates; tapping the calendar fine-tunes them. */
  const applyRule = (next: RepeatRule) => {
    setRule(next);
    setSelected(datesForRule(sourceKey, next));
  };

  const toggleWeekday = (weekday: number) => {
    const weekdays = new Set(rule.weekdays);
    if (weekdays.has(weekday)) weekdays.delete(weekday);
    else weekdays.add(weekday);
    applyRule({ ...rule, weekdays });
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await repeatDelivery({
        company_name: source.company_name,
        delivery_type: source.delivery_type,
        memo: source.memo,
        delivery_dates: selected.map(toDateKey).sort(),
      });
      onRepeated(resultMessage(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "반복 저장하지 못했습니다.");
      setSubmitting(false);
    }
  };

  const tooMany = selected.length > MAX_REPEAT_DATES;
  // Records saved before 납품종류 existed must be edited first (the API requires it).
  const untyped = source.delivery_type === "";

  return (
    <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto pb-1">
      <div className="flex items-center gap-2 rounded-xl bg-brand-lavender px-3 py-2">
        <span
          className="rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: deliveryTypeColor(source.delivery_type) }}
        >
          {source.delivery_type || "종류 없음"}
        </span>
        <span className="min-w-0 truncate font-bold text-slate-800">
          {source.company_name || "배달"}
        </span>
        {source.memo ? (
          <span className="min-w-0 truncate text-sm text-slate-600">{source.memo}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">반복 설정</span>
        <div role="radiogroup" aria-label="반복 방식" className="grid grid-cols-3 gap-2">
          {MODES.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              role="radio"
              aria-checked={rule.mode === value}
              variant={rule.mode === value ? "default" : "outline"}
              size="lg"
              onClick={() =>
                applyRule({ ...rule, mode: value, endKey: defaultEndKey(sourceKey, value) })
              }
              className={cn(
                rule.mode === value && "bg-brand-violet text-white hover:bg-brand-violet/90",
              )}
            >
              {label}
            </Button>
          ))}
        </div>
        {rule.mode === "weekly" ? (
          <div role="group" aria-label="반복할 요일" className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label, weekday) => {
              const on = rule.weekdays.has(weekday);
              return (
                <Button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  variant="outline"
                  onClick={() => toggleWeekday(weekday)}
                  className={cn(
                    "h-10 px-0 text-base font-bold",
                    on && "border-brand-violet bg-brand-violet-mist text-brand-violet",
                  )}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        ) : null}
        {rule.mode !== "custom" ? (
          <DeliveryTextField
            id="repeat_end"
            type="date"
            label="반복 종료일"
            min={toDateKey(addDays(fromDateKey(sourceKey), 1))}
            value={rule.endKey}
            onChange={(event) => applyRule({ ...rule, endKey: event.target.value })}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">
          붙여 넣을 날짜 <span className="font-normal text-slate-400">(눌러서 추가/빼기)</span>
        </span>
        <Calendar
          mode="multiple"
          selected={selected}
          onSelect={(dates) => setSelected(dates ?? [])}
          defaultMonth={fromDateKey(sourceKey)}
          disabled={fromDateKey(sourceKey)}
          locale={ko}
          showOutsideDays={false}
          className="w-full rounded-xl border p-2 [--cell-size:--spacing(10)] [--primary:var(--color-brand-violet)]"
          classNames={{ root: "w-full" }}
        />
      </div>

      {untyped ? (
        <FieldError>납품종류가 없는 배달입니다. 먼저 수정에서 납품종류를 선택해 주세요.</FieldError>
      ) : null}
      {tooMany ? (
        <FieldError>한 번에 {MAX_REPEAT_DATES}개 날짜까지 반복할 수 있습니다.</FieldError>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={submitting || selected.length === 0 || tooMany || untyped}
          onClick={submit}
          className="min-w-20 bg-brand-violet text-white hover:bg-brand-violet/90"
        >
          {submitting ? <Spinner /> : `${selected.length}개 날짜에 붙여넣기`}
        </Button>
      </div>
    </div>
  );
}

interface RepeatDeliverySheetProps {
  /** The delivery being copied; null keeps the sheet closed. */
  source: DeliveryRecord | null;
  onClose: () => void;
  onRepeated: (message: string) => void;
}

/** Copies one saved delivery onto other dates: weekly / monthly rule or hand-picked dates. */
export function RepeatDeliverySheet({ source, onClose, onRepeated }: RepeatDeliverySheetProps) {
  return (
    <BottomSheet open={source !== null} onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>배달 반복</BottomSheetTitle>
          <BottomSheetDescription>
            {source
              ? `${formatDateKeyKo(source.delivery_date)} 배달을 다른 날짜에 복사합니다.`
              : ""}
          </BottomSheetDescription>
        </BottomSheetHeader>
        {source ? (
          <RepeatForm
            key={source.delivery_number}
            source={source}
            onCancel={onClose}
            onRepeated={onRepeated}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
