import { apiRequest } from "@/lib/api-client";
import type { AdminLoginRequest, AuthUser, TokenResponse } from "@/types/auth";

/** The app has no login: the device key gets this device's own account. */
export function authenticateDevice(deviceKey: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/device", {
    method: "POST",
    body: { deviceKey },
    auth: false,
  });
}

export function adminLogin(body: AdminLoginRequest): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/admin/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function getMe(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>("/users/me", { signal });
}
