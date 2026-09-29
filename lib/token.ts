/**
 * JWT storage. Per project rules the token lives ONLY in sessionStorage
 * (never localStorage or cookies). This module is the single access point.
 */
const TOKEN_KEY = "voice-delivery.accessToken";
const TOKEN_EVENT = "voice-delivery:token-change";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(token: string): void {
  storage()?.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function clearToken(): void {
  storage()?.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

/** Subscribe to token changes (for useSyncExternalStore). */
export function subscribeToken(onChange: () => void): () => void {
  window.addEventListener(TOKEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(TOKEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
