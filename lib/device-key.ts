import { Preferences } from "@capacitor/preferences";

import { isNativeApp } from "@/lib/native/platform";

/**
 * The app has no login: a random key, made once and kept on this device,
 * identifies the device's anonymous account on the server. Losing it (app
 * deleted, browser data cleared) means starting a new, empty account.
 *
 * The store app keeps it in native storage (Preferences), which the OS does not
 * clear like web storage; browsers keep it in localStorage.
 */
const DEVICE_KEY = "voice-delivery.deviceKey";

function newDeviceKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // base64url, as the server expects.
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function readKey(): Promise<string | null> {
  if (isNativeApp()) return (await Preferences.get({ key: DEVICE_KEY })).value;
  try {
    return window.localStorage.getItem(DEVICE_KEY);
  } catch {
    return null;
  }
}

async function writeKey(value: string): Promise<void> {
  if (isNativeApp()) {
    await Preferences.set({ key: DEVICE_KEY, value });
    return;
  }
  try {
    window.localStorage.setItem(DEVICE_KEY, value);
  } catch {
    // Storage blocked (private mode): the key lasts for this page only.
  }
}

let pending: Promise<string> | null = null;

/** This device's key, created on first use. */
export function getDeviceKey(): Promise<string> {
  pending ??= (async () => {
    const existing = await readKey();
    if (existing) return existing;
    const created = newDeviceKey();
    await writeKey(created);
    return created;
  })().catch((error: unknown) => {
    pending = null; // try again next time
    throw error;
  });
  return pending;
}
