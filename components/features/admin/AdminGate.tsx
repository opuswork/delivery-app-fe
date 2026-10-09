"use client";

import { useSyncExternalStore } from "react";

import { AdminDashboard } from "@/components/features/admin/AdminDashboard";
import { AdminLoginScreen } from "@/components/features/admin/AdminLoginScreen";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { adminToken } from "@/lib/token";

/**
 * The token lives in sessionStorage, which the server cannot read, so the
 * check happens in the browser. The API refuses non-admin tokens regardless.
 */
export function AdminGate() {
  const token = useSyncExternalStore(adminToken.subscribe, adminToken.get, () => undefined);
  if (token === undefined) return <FullScreenLoader />;
  return token ? <AdminDashboard /> : <AdminLoginScreen />;
}
