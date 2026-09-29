"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { AuthContext, useSessionToken } from "@/hooks/useAuth";
import { getMe } from "@/lib/api/auth";
import { clearToken } from "@/lib/token";
import type { AuthUser } from "@/types/auth";

/**
 * Client-side route protection. The JWT lives in sessionStorage, which the
 * server cannot read, so the check has to happen in the browser.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSessionToken();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    // A 401 here clears the token (api-client), which triggers the redirect above.
    getMe(controller.signal)
      .then(setUser)
      .catch(() => undefined);
    return () => controller.abort();
  }, [token]);

  const logout = useCallback(() => clearToken(), []);
  const value = useMemo(() => ({ user, logout }), [user, logout]);

  if (!token) return <FullScreenLoader />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
