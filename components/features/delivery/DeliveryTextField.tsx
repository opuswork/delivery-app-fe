"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DeliveryTextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
  /** Shown inside the box on the right (e.g. the badge colour picker). */
  endAdornment?: ReactNode;
}

export function DeliveryTextField({
  id,
  label,
  error,
  endAdornment,
  className,
  ...inputProps
}: DeliveryTextFieldProps) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 rounded-lg bg-white text-base md:text-base",
            endAdornment ? "pr-12" : null,
            className,
          )}
          {...inputProps}
        />
        {endAdornment ? (
          <div className="absolute top-1/2 right-1 -translate-y-1/2">{endAdornment}</div>
        ) : null}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
