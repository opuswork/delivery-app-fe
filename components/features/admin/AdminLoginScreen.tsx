"use client";

import { useState } from "react";

import { AppTitle } from "@/components/features/auth/AppTitle";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { adminLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import { adminToken } from "@/lib/token";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "아이디 또는 비밀번호가 올바르지 않습니다.";
    if (error.status === 429) return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    if (error.status === 400) return "아이디와 비밀번호를 입력해 주세요.";
    return error.message;
  }
  return "로그인 중 오류가 발생했습니다.";
}

const inputClass =
  "h-14 rounded-xl border-slate-300 bg-white px-4 text-lg md:text-lg placeholder:text-slate-300";

/** Sign-in for the dashboard. Only the "admin" login exists; the app itself has none. */
export function AdminLoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { accessToken } = await adminLogin({ loginId: loginId.trim(), password });
      adminToken.set(accessToken);
    } catch (reason) {
      setError(loginErrorMessage(reason));
      setSubmitting(false);
    }
  };

  return (
    <MobileShell variant="navy" className="pt-[18vh] pb-16">
      <AppTitle />
      <Card className="rounded-2xl bg-white py-10 shadow-xl ring-1 ring-slate-200">
        <CardContent className="px-7">
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup className="gap-7">
              <p className="text-center text-lg font-semibold text-slate-800">관리자 로그인</p>
              <Field className="gap-3">
                <FieldLabel htmlFor="admin-id" className="text-lg font-normal text-slate-600">
                  아이디
                </FieldLabel>
                <Input
                  id="admin-id"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="admin"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field className="gap-3">
                <FieldLabel htmlFor="admin-password" className="text-lg font-normal text-slate-600">
                  비밀번호
                </FieldLabel>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </Field>
              {error ? <FieldError className="text-center">{error}</FieldError> : null}
              <Button
                type="submit"
                disabled={!loginId.trim() || !password || submitting}
                className="h-14 rounded-2xl bg-brand-blue text-lg font-medium text-white hover:bg-brand-blue/90 disabled:bg-brand-blue-soft disabled:opacity-100"
              >
                {submitting ? <Spinner className="size-5" /> : "로그인"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </MobileShell>
  );
}
