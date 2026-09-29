"use client";

import type { ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface DeliveryTextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
}

export function DeliveryTextField({ id, label, error, ...inputProps }: DeliveryTextFieldProps) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </FieldLabel>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        className="h-11 rounded-lg bg-white text-base md:text-base"
        {...inputProps}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
