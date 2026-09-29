"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { NumericField } from "@/components/features/auth/NumericField";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useSessionToken } from "@/hooks/useAuth";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import { setToken } from "@/lib/token";
import { loginSchema, type LoginFormValues } from "@/lib/validation/login";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "아이디 또는 비밀번호가 올바르지 않습니다.";
    if (error.status === 429) return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    return error.message;
  }
  return "로그인 중 오류가 발생했습니다.";
}

export function LoginForm() {
  const router = useRouter();
  const token = useSessionToken();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { loginId: "", password: "" },
  });

  // Already signed in (token in this tab's sessionStorage) → go to the main screen.
  useEffect(() => {
    if (token) router.replace("/");
  }, [token, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const { accessToken } = await login(values);
      setToken(accessToken);
      router.replace("/");
    } catch (error) {
      setSubmitError(loginErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-7">
        <Controller
          name="loginId"
          control={control}
          render={({ field, fieldState }) => (
            <NumericField
              id="loginId"
              label="아이디 (연락처)"
              placeholder="1234"
              autoComplete="username"
              maxDigits={4}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              error={fieldState.isTouched ? fieldState.error?.message : undefined}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <NumericField
              id="password"
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="current-password"
              maxDigits={8}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              error={fieldState.isTouched ? fieldState.error?.message : undefined}
            />
          )}
        />
        {submitError ? (
          <FieldError className="text-center">{submitError}</FieldError>
        ) : null}
        <Button
          type="submit"
          disabled={!formState.isValid || formState.isSubmitting}
          className="h-14 rounded-2xl bg-brand-blue text-lg font-medium text-white hover:bg-brand-blue/90 disabled:bg-brand-blue-soft disabled:opacity-100"
        >
          {formState.isSubmitting ? <Spinner className="size-5" /> : "로그인"}
        </Button>
      </FieldGroup>
    </form>
  );
}
