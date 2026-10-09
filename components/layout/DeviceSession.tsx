"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { Button } from "@/components/ui/button";
import { AuthContext, useSessionToken } from "@/hooks/useAuth";
import { authenticateDevice, getMe } from "@/lib/api/auth";
import { getDeviceKey } from "@/lib/device-key";
import { setToken } from "@/lib/token";
import type { AuthUser } from "@/types/auth";

/**
 * The app has no login. Without a token, this signs the device in with its
 * own key (creating its account the first time); when a token expires the
 * api-client clears it and this signs in again, so people never see a login.
 */
export function DeviceSession({ children }: { children: React.ReactNode }) {
  const token = useSessionToken();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (token !== null) return;
    let cancelled = false;
    getDeviceKey()
      .then(authenticateDevice)
      .then(({ accessToken }) => {
        if (!cancelled) setToken(accessToken);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    // A 401 here clears the token (api-client), which signs in again above.
    getMe(controller.signal)
      .then(setUser)
      .catch(() => undefined);
    return () => controller.abort();
  }, [token]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((count) => count + 1);
  }, []);
  const value = useMemo(() => ({ user }), [user]);

  if (failed && !token) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand-page px-6 text-center">
        <p className="text-lg text-slate-700">서버에 연결할 수 없습니다.</p>
        <p className="text-sm text-slate-500">인터넷 연결을 확인한 뒤 다시 시도해 주세요.</p>
        <Button onClick={retry} className="h-12 rounded-xl bg-brand-blue px-6 text-base text-white">
          다시 시도
        </Button>
      </main>
    );
  }
  if (!token) return <FullScreenLoader />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
