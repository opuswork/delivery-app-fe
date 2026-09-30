"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DeleteDeliveryButton } from "@/components/features/delivery/DeleteDeliveryButton";
import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createDelivery, deleteDelivery, updateDelivery } from "@/lib/api/deliveries";
import {
  deliverySchema,
  MAX_MEMO_LENGTH,
  type DeliveryFormValues,
} from "@/lib/validation/delivery";
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

/** 납품일 + 메모, used for voice confirmation, manual entry and editing. */
export function DeliveryForm({
  defaultValues,
  editDeliveryNumber,
  onCancel,
  onSaved,
  onDeleted,
}: DeliveryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
  });
  const { errors, isSubmitting } = formState;

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
        <Field data-invalid={Boolean(errors.memo)} className="gap-1.5">
          <FieldLabel htmlFor="memo" className="text-sm font-medium text-slate-700">
            메모
          </FieldLabel>
          <Textarea
            id="memo"
            rows={6}
            maxLength={MAX_MEMO_LENGTH}
            placeholder="홈플러스 1급진간장 1.8리터 10통"
            aria-invalid={Boolean(errors.memo)}
            className="min-h-40 resize-none rounded-lg bg-white text-base md:text-base"
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
