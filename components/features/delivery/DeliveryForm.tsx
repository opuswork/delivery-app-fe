"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { DeliveryItemRow } from "@/components/features/delivery/DeliveryItemRow";
import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createDeliveryBatch } from "@/lib/api/deliveries";
import {
  deliverySchema,
  MAX_DELIVERY_ITEMS,
  type DeliveryFormValues,
} from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

interface DeliveryFormProps {
  defaultValues: DeliveryFormValues;
  onCancel: () => void;
  onSaved: (records: DeliveryRecord[]) => void;
}

export function DeliveryForm({ defaultValues, onCancel, onSaved }: DeliveryFormProps) {
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
      onSaved(await createDeliveryBatch(values));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  });

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
