"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createDelivery } from "@/lib/api/deliveries";
import { deliverySchema, type DeliveryFormValues } from "@/lib/validation/delivery";
import type { DeliveryRecord } from "@/types/delivery";

interface DeliveryFormProps {
  defaultValues: DeliveryFormValues;
  onCancel: () => void;
  onSaved: (record: DeliveryRecord) => void;
}

export function DeliveryForm({ defaultValues, onCancel, onSaved }: DeliveryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues,
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      onSaved(await createDelivery(values));
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
          id="product_name"
          label="상품명"
          placeholder="1급진간장1.8L"
          error={errors.product_name?.message}
          {...register("product_name")}
        />
        <DeliveryTextField
          id="product_quantity"
          label="수량"
          placeholder="4통"
          error={errors.product_quantity?.message}
          {...register("product_quantity")}
        />
        <DeliveryTextField
          id="delivery_date"
          type="date"
          label="납품일"
          error={errors.delivery_date?.message}
          {...register("delivery_date")}
        />
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
            {isSubmitting ? <Spinner /> : "저장"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
