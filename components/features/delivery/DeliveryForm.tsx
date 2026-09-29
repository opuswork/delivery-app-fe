"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { DeleteDeliveryButton } from "@/components/features/delivery/DeleteDeliveryButton";
import { DeliveryItemRow } from "@/components/features/delivery/DeliveryItemRow";
import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createDeliveryBatch, updateDeliveryGroup } from "@/lib/api/deliveries";
import {
  deliverySchema,
  MAX_DELIVERY_ITEMS,
  type DeliveryFormValues,
} from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

interface DeliveryFormProps {
  defaultValues: DeliveryFormValues;
  /** Set when editing a saved company block: its row numbers. */
  editDeliveryNumbers?: number[];
  onCancel: () => void;
  onSaved: (records: DeliveryRecord[]) => void;
  onDeleted?: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function DeliveryForm({
  defaultValues,
  editDeliveryNumbers,
  onCancel,
  onSaved,
  onDeleted,
}: DeliveryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, register, handleSubmit, formState } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      onSaved(
        editDeliveryNumbers
          ? await updateDeliveryGroup({ ...values, delivery_numbers: editDeliveryNumbers })
          : await createDeliveryBatch(values),
      );
    } catch (error) {
      setSubmitError(errorMessage(error, "저장하지 못했습니다."));
    }
  });

  // Uses the saved 납품처/납품일 so a half-edited form cannot block deleting.
  const deleteBlock = async () => {
    if (!editDeliveryNumbers) return;
    setSubmitError(null);
    try {
      await updateDeliveryGroup({
        delivery_numbers: editDeliveryNumbers,
        company_name: defaultValues.company_name,
        delivery_date: defaultValues.delivery_date,
        items: [],
      });
      onDeleted?.();
    } catch (error) {
      setSubmitError(errorMessage(error, "삭제하지 못했습니다."));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <DeliveryTextField
          id="company_name"
          label="납품처"
          placeholder="하나마트"
          error={errors.company_name?.message}
          {...register("company_name")}
        />
        <DeliveryTextField
          id="delivery_date"
          type="date"
          label="납품일"
          error={errors.delivery_date?.message}
          {...register("delivery_date")}
        />
        {fields.map((field, index) => (
          <DeliveryItemRow
            key={field.id}
            index={index}
            register={register}
            productError={errors.items?.[index]?.product_name?.message}
            quantityError={errors.items?.[index]?.product_quantity?.message}
            onRemove={fields.length > 1 ? () => remove(index) : undefined}
          />
        ))}
        {errors.items?.root?.message || errors.items?.message ? (
          <FieldError>{errors.items?.root?.message ?? errors.items?.message}</FieldError>
        ) : null}
        {fields.length < MAX_DELIVERY_ITEMS ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ product_name: "", product_quantity: "" })}
            className="border-dashed text-brand-violet"
          >
            <PlusIcon /> 상품 추가
          </Button>
        ) : null}
        {submitError ? <FieldError>{submitError}</FieldError> : null}
        {editDeliveryNumbers ? (
          <DeleteDeliveryButton disabled={isSubmitting} onConfirm={deleteBlock} />
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
            {isSubmitting ? <Spinner /> : `저장${fields.length > 1 ? ` (${fields.length}건)` : ""}`}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
