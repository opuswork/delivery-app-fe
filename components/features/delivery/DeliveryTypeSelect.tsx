"use client";

import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { DELIVERY_TYPES, deliveryTypeColor } from "@/lib/constants/delivery";
import { cn } from "@/lib/utils";

interface DeliveryTypeSelectProps extends ComponentProps<"select"> {
  id: string;
  /** The currently selected 납품종류 ("" when none), for the colour dot. */
  selected: string;
  error?: string;
}

/** 납품종류 dropdown (런 / 두부 / 간장) with the selected type's badge colour. */
export function DeliveryTypeSelect({
  id,
  selected,
  error,
  className,
  ...selectProps
}: DeliveryTypeSelectProps) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-sm font-medium text-slate-700">
        납품종류
      </FieldLabel>
      <div className="relative">
        {selected ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: deliveryTypeColor(selected) }}
          />
        ) : null}
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            selected ? "pl-8 text-slate-900" : "text-slate-400",
            className,
          )}
          {...selectProps}
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
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
