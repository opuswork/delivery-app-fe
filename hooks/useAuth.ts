"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import { getToken, subscribeToken } from "@/lib/token";
import type { AuthUser } from "@/types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthGuard>");
  return value;
}

/**
 * Current JWT from sessionStorage.
 * `undefined` while rendering on the server / hydrating (unknown), `null` when signed out.
 */
export function useSessionToken(): string | null | undefined {
  return useSyncExternalStore(subscribeToken, getToken, () => undefined);
}
