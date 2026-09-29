"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { createDelivery } from "@/lib/api/deliveries";
import { HandsFreeEngine, type HandsFreeStatus } from "@/lib/speech/hands-free-engine";
import { getRecognitionConstructor } from "@/lib/speech/recognition";
import { isSpeechSynthesisSupported, primeSpeech } from "@/lib/speech/tts";
import type { DeliveryRecord } from "@/types/delivery";

const noopSubscribe = () => () => {};

interface Options {
  onSaved: (record: DeliveryRecord) => void;
}

/** React wrapper around HandsFreeEngine: state, screen wake lock and cleanup. */
export function useHandsFreeAssistant({ onSaved }: Options) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionConstructor() !== null && isSpeechSynthesisSupported(),
    () => true,
  );
  const [status, setStatus] = useState<HandsFreeStatus>("off");
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<HandsFreeEngine | null>(null);
  const onSavedRef = useRef(onSaved);
  const active = status !== "off";

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const enable = useCallback(() => {
    setError(null);
    primeSpeech(); // must run inside the tap for iOS to allow speech later
    engineRef.current ??= new HandsFreeEngine({
      onStatus: setStatus,
      onLiveText: setLiveText,
      onError: setError,
      save: async (values) => onSavedRef.current(await createDelivery(values)),
    });
    if (!engineRef.current.start()) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
    }
  }, []);

  const disable = useCallback(() => engineRef.current?.stop(), []);

  // Keep the screen on while listening; turn off when the page is left.
  useEffect(() => {
    if (!active) return;
    let sentinel: WakeLockSentinel | null = null;
    let released = false;
    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (released) void lock.release();
          else sentinel = lock;
        })
        .catch(() => undefined);
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") engineRef.current?.stop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      released = true;
      void sentinel?.release();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);

  useEffect(() => () => engineRef.current?.stop(), []);

  return { supported, status, active, liveText, error, enable, disable };
}
