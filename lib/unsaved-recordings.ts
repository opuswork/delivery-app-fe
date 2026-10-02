import type { DeliveryFormValues } from "@/lib/validation/delivery";

/** A hands-free recording that could not be saved as a delivery yet. */
export interface UnsavedRecording {
  id: string;
  /** ISO time it was recorded. */
  recordedAt: string;
  /** Everything that was heard. */
  transcript: string;
  /** What could be read from it; missing fields are empty. */
  values: DeliveryFormValues;
  /** incomplete: 납품일/납품처 not heard · save-failed: the server could not be reached */
  reason: "incomplete" | "save-failed";
}

/** At most this many are kept (oldest dropped first). */
const MAX_KEPT = 50;

const keyFor = (userId: number) => `voice-delivery.unsaved-recordings.${userId}`;

/**
 * Kept on this device per user (localStorage), so they survive closing the
 * app. Storage can be unavailable (private mode): then the list is empty.
 */
export function loadUnsavedRecordings(userId: number): UnsavedRecording[] {
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as UnsavedRecording[]) : [];
  } catch {
    return [];
  }
}

export function storeUnsavedRecordings(userId: number, recordings: UnsavedRecording[]): void {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(recordings.slice(-MAX_KEPT)));
  } catch {
    // Storage full or blocked: the list still works until the page is closed.
  }
}

export function newUnsavedRecording(
  transcript: string,
  values: DeliveryFormValues,
  reason: UnsavedRecording["reason"],
): UnsavedRecording {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: new Date().toISOString(),
    transcript,
    values,
    reason,
  };
}
