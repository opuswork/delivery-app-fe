import { Capacitor } from "@capacitor/core";

/**
 * True inside the Android/iOS store app (the Capacitor shell loading this
 * site), false in a normal browser or the installed PWA.
 */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}
