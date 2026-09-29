import { apiRequest } from "@/lib/api-client";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function getMe(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>("/users/me", { signal });
}
