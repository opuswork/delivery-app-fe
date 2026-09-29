"use client";

import type { ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface NumericFieldProps
  extends Omit<ComponentProps<"input">, "onChange" | "value" | "inputMode"> {
  id: string;
  label: string;
  value: string;
  maxDigits: number;
  error?: string;
  onValueChange: (value: string) => void;
}

/** Label + digits-only input + error message, styled after the login reference. */
export function NumericField({
  id,
  label,
  value,
  maxDigits,
  error,
  onValueChange,
  ...inputProps
}: NumericFieldProps) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-3">
      <FieldLabel htmlFor={id} className="text-lg font-normal text-slate-600">
        {label}
      </FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxDigits}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) =>
          onValueChange(event.target.value.replace(/\D/g, "").slice(0, maxDigits))
        }
        className="h-14 rounded-xl border-slate-300 bg-white px-4 text-lg md:text-lg placeholder:text-slate-300"
        {...inputProps}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
