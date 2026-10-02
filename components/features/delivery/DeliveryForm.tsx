"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { BadgeColorPicker } from "@/components/features/delivery/BadgeColorPicker";
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
  type ValidDelivery,
} from "@/lib/validation/delivery";
import type { DeliveryRecord, KnownCompanies } from "@/types/delivery";

interface DeliveryFormProps {
  defaultValues: DeliveryFormValues;
  /** Set when editing a saved delivery. */
  editDeliveryNumber?: number;
  onCancel: () => void;
  onSaved: (record: DeliveryRecord) => void;
  onDeleted?: () => void;
  /** Typing a known 납품처 picks its last colour (until a colour is chosen by hand). */
  knownCompanies?: KnownCompanies;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** 납품일 + 납품처 (with its badge colour) + 메모, used for voice confirmation, manual entry and editing. */
export function DeliveryForm({
  defaultValues,
  editDeliveryNumber,
  onCancel,
  onSaved,
  onDeleted,
  knownCompanies,
}: DeliveryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState, control, setValue } = useForm<DeliveryFormValues, unknown, ValidDelivery>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
  });
  const { errors, isSubmitting } = formState;
  const badgeColor = useWatch({ control, name: "badge_color" });
  const [colorPickedByHand, setColorPickedByHand] = useState(false);

  const pickColor = (color: string) => {
    setColorPickedByHand(true);
    setValue("badge_color", color, { shouldDirty: true });
  };

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
          endAdornment={<BadgeColorPicker value={badgeColor} onChange={pickColor} />}
          {...register("company_name", {
            onChange: (event: { target: { value: string } }) => {
              const known = knownCompanies?.get(event.target.value.trim());
              if (known && !colorPickedByHand) setValue("badge_color", known);
            },
          })}
        />
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
