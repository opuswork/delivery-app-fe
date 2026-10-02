"use client";

import { useCallback, useState } from "react";

import {
  loadUnsavedRecordings,
  storeUnsavedRecordings,
  type UnsavedRecording,
} from "@/lib/unsaved-recordings";

/** Hands-free recordings kept to be fixed and saved later (per user, on this device). */
export function useUnsavedRecordings(userId: number | undefined) {
  const [loaded, setLoaded] = useState<{ userId: number | undefined; items: UnsavedRecording[] }>(
    () => ({ userId, items: userId === undefined ? [] : loadUnsavedRecordings(userId) }),
  );
  // Another user signed in on this device: show their list.
  if (loaded.userId !== userId) {
    setLoaded({ userId, items: userId === undefined ? [] : loadUnsavedRecordings(userId) });
  }

  const update = useCallback(
    (change: (items: UnsavedRecording[]) => UnsavedRecording[]) => {
      setLoaded((current) => {
        const items = change(current.items);
        if (current.userId !== undefined) storeUnsavedRecordings(current.userId, items);
        return { ...current, items };
      });
    },
    [],
  );

  const add = useCallback(
    (recording: UnsavedRecording) => update((items) => [...items, recording]),
    [update],
  );
  const remove = useCallback(
    (id: string) => update((items) => items.filter((item) => item.id !== id)),
    [update],
  );

  return { items: loaded.items, add, remove };
}
