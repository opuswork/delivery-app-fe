"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { ko } from "react-day-picker/locale";
import { useForm, useWatch } from "react-hook-form";

import { BadgeColorPicker } from "@/components/features/delivery/BadgeColorPicker";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { bulkUpdateDeliveries, listSameCompanyDeliveries } from "@/lib/api/deliveries";
import { badgeColorOf } from "@/lib/constants/delivery";
import { fromDateKey, groupByDeliveryDate, toDateKey } from "@/lib/date";
import {
  deliveryContentSchema,
  MAX_MEMO_LENGTH,
  type DeliveryContentValues,
  type ValidDeliveryContent,
} from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

function sameContent(a: DeliveryRecord, b: DeliveryRecord): boolean {
  return (
    a.company_name === b.company_name &&
    a.badge_color === b.badge_color &&
    a.memo === b.memo
  );
}

interface LoadedCandidates {
  records: DeliveryRecord[];
  error: string | null;
}

interface BulkEditFormProps {
  source: DeliveryRecord;
  onCancel: () => void;
  onSaved: (message: string) => void;
}

function BulkEditForm({ source, onCancel, onSaved }: BulkEditFormProps) {
  const [loaded, setLoaded] = useState<LoadedCandidates | null>(null);
  /** null until the user taps a date: then the identical deliveries are selected. */
  const [picked, setPicked] = useState<Date[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState, control, setValue } = useForm<
    DeliveryContentValues,
    unknown,
    ValidDeliveryContent
  >({
    resolver: zodResolver(deliveryContentSchema),
    defaultValues: {
      company_name: source.company_name,
      badge_color: badgeColorOf(source),
      memo: source.memo,
    },
  });
  const { errors, isSubmitting } = formState;
  const badgeColor = useWatch({ control, name: "badge_color" });

  useEffect(() => {
    const controller = new AbortController();
    listSameCompanyDeliveries(source.delivery_number, controller.signal)
      .then((records) => setLoaded({ records, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({
          records: [],
          error: error instanceof Error ? error.message : "배달 목록을 불러오지 못했습니다.",
        });
      });
    return () => controller.abort();
  }, [source.delivery_number]);

  const byDate = useMemo(() => groupByDeliveryDate(loaded?.records ?? []), [loaded]);
  const candidateDates = useMemo(() => [...byDate.keys()].map(fromDateKey), [byDate]);
  /** Dates holding exactly this delivery (e.g. the ones made by 반복). */
  const identicalDates = useMemo(
    () =>
      [...byDate.entries()]
        .filter(([, records]) => records.some((r) => sameContent(r, source)))
        .map(([key]) => fromDateKey(key)),
    [byDate, source],
  );
  const selected = picked ?? identicalDates;
  const selectedNumbers = selected.flatMap(
    (date) => byDate.get(toDateKey(date))?.map((r) => r.delivery_number) ?? [],
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const { updated } = await bulkUpdateDeliveries({
        ...values,
        delivery_numbers: selectedNumbers,
      });
      onSaved(`${updated}건을 수정했습니다.`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "수정하지 못했습니다.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-h-[70dvh] flex-col overflow-y-auto pb-1">
      <FieldGroup className="gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-end justify-between gap-2">
            <span className="flex flex-col text-sm font-medium text-slate-700">
              수정할 날짜
              <span className="text-xs font-normal text-slate-400">밑줄 날짜만 선택 가능</span>
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!loaded}
                onClick={() => setPicked(candidateDates)}
              >
                전체 선택
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!loaded}
                onClick={() => setPicked([])}
              >
                선택 해제
              </Button>
            </div>
          </div>
          {loaded ? (
            <Calendar
              mode="multiple"
              selected={selected}
              onSelect={(dates) => setPicked(dates ?? [])}
              defaultMonth={fromDateKey(source.delivery_date)}
              disabled={(date) => !byDate.has(toDateKey(date))}
              modifiers={{ candidate: candidateDates }}
              modifiersClassNames={{
                candidate:
                  "[&>button]:font-extrabold [&>button]:underline [&>button]:decoration-2 [&>button]:underline-offset-4",
              }}
              locale={ko}
              showOutsideDays={false}
              className="w-full rounded-xl border p-2 [--cell-size:--spacing(10)] [--primary:var(--color-brand-violet)]"
              classNames={{ root: "w-full" }}
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border">
              <Spinner className="text-brand-violet" />
            </div>
          )}
          {loaded?.error ? <FieldError>{loaded.error}</FieldError> : null}
          <p className="text-sm font-bold text-brand-violet">{selectedNumbers.length}건 선택됨</p>
        </div>

        <DeliveryTextField
          id="bulk_company_name"
          label="납품처"
          maxLength={100}
          error={errors.company_name?.message}
          endAdornment={
            <BadgeColorPicker
              value={badgeColor}
              onChange={(color) => setValue("badge_color", color, { shouldDirty: true })}
            />
          }
          {...register("company_name")}
        />
        <Field data-invalid={Boolean(errors.memo)} className="gap-1.5">
          <FieldLabel htmlFor="bulk_memo" className="text-sm font-medium text-slate-700">
            메모 <span className="font-normal text-slate-400">(선택)</span>
          </FieldLabel>
          <Textarea
            id="bulk_memo"
            data-base-ui-swipe-ignore
            rows={3}
            maxLength={MAX_MEMO_LENGTH}
            aria-invalid={Boolean(errors.memo)}
            className="min-h-20 resize-none rounded-lg bg-white text-base md:text-base"
            {...register("memo")}
          />
          {errors.memo ? <FieldError>{errors.memo.message}</FieldError> : null}
        </Field>

        {submitError ? <FieldError>{submitError}</FieldError> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || selectedNumbers.length === 0}
            className="min-w-20 bg-brand-violet text-white hover:bg-brand-violet/90"
          >
            {isSubmitting ? <Spinner /> : `${selectedNumbers.length}건 수정`}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

interface BulkEditDeliverySheetProps {
  /** The delivery whose 납품처 is being edited on several dates; null keeps it closed. */
  source: DeliveryRecord | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** 선택수정: pick dates of the same 납품처 on a calendar and change them all at once. */
export function BulkEditDeliverySheet({ source, onClose, onSaved }: BulkEditDeliverySheetProps) {
  return (
    <BottomSheet open={source !== null} onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>선택수정</BottomSheetTitle>
          <BottomSheetDescription>
            {source
              ? `${source.company_name || "배달"}의 날짜를 골라 한 번에 수정합니다.`
              : ""}
          </BottomSheetDescription>
        </BottomSheetHeader>
        {source ? (
          <BulkEditForm
            key={source.delivery_number}
            source={source}
            onCancel={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
