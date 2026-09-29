"use client";

import { XIcon } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import { DeliveryTextField } from "@/components/features/delivery/DeliveryTextField";
import { Button } from "@/components/ui/button";
import type { DeliveryFormValues } from "@/lib/validation/delivery";

interface DeliveryItemRowProps {
  index: number;
  register: UseFormRegister<DeliveryFormValues>;
  productError?: string;
  quantityError?: string;
  /** Omitted when this is the only product (at least one is required). */
  onRemove?: () => void;
}

/** One product line of a delivery: 상품명 + 수량 (+ remove). */
export function DeliveryItemRow({
  index,
  register,
  productError,
  quantityError,
  onRemove,
}: DeliveryItemRowProps) {
  const n = index + 1;

  return (
    <div className="flex items-start gap-2">
      <div className="grid flex-1 grid-cols-[1fr_6rem] gap-2">
        <DeliveryTextField
          id={`items.${index}.product_name`}
          label={`상품명 ${n}`}
          placeholder="1급진간장1.8L"
          error={productError}
          {...register(`items.${index}.product_name`)}
        />
        <DeliveryTextField
          id={`items.${index}.product_quantity`}
          label="수량"
          placeholder="4통"
          error={quantityError}
          {...register(`items.${index}.product_quantity`)}
        />
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`상품 ${n} 삭제`}
          onClick={onRemove}
          className="mt-7 text-slate-400 hover:text-destructive"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
