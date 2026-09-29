"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TICK_MS = 250;

/**
 * Elapsed-time counter that only advances while `running` is true.
 * Pausing freezes the value; `reset` returns it to zero.
 */
export function useRecordingTimer(running: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const segmentStart = performance.now();
    const tick = () =>
      setElapsedMs(accumulatedRef.current + performance.now() - segmentStart);
    const id = window.setInterval(tick, TICK_MS);
    return () => {
      window.clearInterval(id);
      accumulatedRef.current += performance.now() - segmentStart;
    };
  }, [running]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    setElapsedMs(0);
  }, []);

  /** Accumulated time of completed segments (exact once the timer has stopped). */
  const read = useCallback(() => accumulatedRef.current, []);

  return { elapsedMs, reset, read };
}
