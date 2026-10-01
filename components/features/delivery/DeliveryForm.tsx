"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { DeleteDeliveryButton } from "@/components/features/delivery/DeleteDeliveryButton";
import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createDelivery, deleteDelivery, updateDelivery } from "@/lib/api/deliveries";
import { DELIVERY_TYPES, DELIVERY_TYPE_COLORS } from "@/lib/constants/delivery";
import {
  deliverySchema,
  MAX_MEMO_LENGTH,
  type DeliveryFormValues,
  type ValidDelivery,
} from "@/lib/validation/delivery";
import { cn } from "@/lib/utils";
import type { DeliveryRecord } from "@/types/delivery";

interface DeliveryFormProps {
  defaultValues: DeliveryFormValues;
  /** Set when editing a saved delivery. */
  editDeliveryNumber?: number;
  onCancel: () => void;
  onSaved: (record: DeliveryRecord) => void;
  onDeleted?: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** 납품일 + 납품처 + 납품종류 + 메모, used for voice confirmation, manual entry and editing. */
export function DeliveryForm({
  defaultValues,
  editDeliveryNumber,
  onCancel,
  onSaved,
  onDeleted,
}: DeliveryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState, control } = useForm<DeliveryFormValues, unknown, ValidDelivery>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
  });
  const { errors, isSubmitting } = formState;
  const deliveryType = useWatch({ control, name: "delivery_type" });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      onSaved(
        editDeliveryNumber
          ? await updateDelivery(editDeliveryNumber, values)
          : await createDelivery(values),
      );
    } catch (error) {
      setSubmitError(errorMessage(error, "저장하지 못했습니다."));
    }
  });

  const remove = async () => {
    if (!editDeliveryNumber) return;
    setSubmitError(null);
    try {
      await deleteDelivery(editDeliveryNumber);
      onDeleted?.();
    } catch (error) {
      setSubmitError(errorMessage(error, "삭제하지 못했습니다."));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <DeliveryTextField
          id="delivery_date"
          type="date"
          label="납품일"
          error={errors.delivery_date?.message}
          {...register("delivery_date")}
        />
        <DeliveryTextField
          id="company_name"
          label="납품처"
          placeholder="홈플러스"
          maxLength={100}
          error={errors.company_name?.message}
          {...register("company_name")}
        />
        <Field data-invalid={Boolean(errors.delivery_type)} className="gap-1.5">
          <FieldLabel htmlFor="delivery_type" className="text-sm font-medium text-slate-700">
            납품종류
          </FieldLabel>
          <div className="relative">
            {deliveryType ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: DELIVERY_TYPE_COLORS[deliveryType] }}
              />
            ) : null}
            <select
              id="delivery_type"
              aria-invalid={Boolean(errors.delivery_type)}
              className={cn(
                "h-11 w-full appearance-none rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                deliveryType ? "pl-8 text-slate-900" : "text-slate-400",
              )}
              {...register("delivery_type")}
            >
              <option value="" disabled>
                선택해 주세요
              </option>
              {DELIVERY_TYPES.map((type) => (
                <option key={type} value={type} className="text-slate-900">
                  {type}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
            />
          </div>
          {errors.delivery_type ? (
            <FieldError>{errors.delivery_type.message}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={Boolean(errors.memo)} className="gap-1.5">
          <FieldLabel htmlFor="memo" className="text-sm font-medium text-slate-700">
            메모 <span className="font-normal text-slate-400">(선택)</span>
          </FieldLabel>
          <Textarea
            id="memo"
            data-base-ui-swipe-ignore
            rows={5}
            maxLength={MAX_MEMO_LENGTH}
            placeholder="1급진간장 1.8리터 10통"
            aria-invalid={Boolean(errors.memo)}
            className="min-h-32 resize-none rounded-lg bg-white text-base md:text-base"
            {...register("memo")}
          />
          {errors.memo ? <FieldError>{errors.memo.message}</FieldError> : null}
        </Field>
        {submitError ? <FieldError>{submitError}</FieldError> : null}
        {editDeliveryNumber ? (
          <DeleteDeliveryButton disabled={isSubmitting} onConfirm={remove} />
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="min-w-20 bg-brand-violet text-white hover:bg-brand-violet/90"
          >
            {isSubmitting ? <Spinner /> : "저장"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
