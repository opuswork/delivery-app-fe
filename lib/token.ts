/**
 * JWT storage. Per project rules tokens live ONLY in sessionStorage
 * (never localStorage or cookies). This module is the single access point.
 *
 * The device's token and the admin's token are kept apart, so opening the
 * dashboard never signs the app out (or the other way round).
 */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function createTokenStore(key: string, eventName: string) {
  return {
    get(): string | null {
      return storage()?.getItem(key) ?? null;
    },
    set(token: string): void {
      storage()?.setItem(key, token);
      window.dispatchEvent(new Event(eventName));
    },
    clear(): void {
      storage()?.removeItem(key);
      window.dispatchEvent(new Event(eventName));
    },
    /** Subscribe to token changes (for useSyncExternalStore). */
    subscribe(onChange: () => void): () => void {
      window.addEventListener(eventName, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(eventName, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
  };
}

const deviceToken = createTokenStore(
  "voice-delivery.accessToken",
  "voice-delivery:token-change",
);

export const getToken = deviceToken.get;
export const setToken = deviceToken.set;
export const clearToken = deviceToken.clear;
export const subscribeToken = deviceToken.subscribe;

/** The dashboard's token (the "admin" login). */
export const adminToken = createTokenStore(
  "voice-delivery.adminToken",
  "voice-delivery:admin-token-change",
);
