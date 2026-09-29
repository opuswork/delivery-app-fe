"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SPEECH_LANG } from "@/lib/constants/recording";
import { useRecordingTimer } from "@/hooks/useRecordingTimer";
import type { RecordingResult, RecordingStatus } from "@/types/recording";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

const STOP_TIMEOUT_MS = 3000;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

function errorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없습니다.";
    case "network":
      return "음성 인식 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.";
    default:
      return "음성 인식 중 오류가 발생했습니다.";
  }
}

interface Options {
  onComplete: (result: RecordingResult) => void;
}

/**
 * Voice recording state machine built on the browser Web Speech API.
 *
 * idle → requesting → recording ⇄ paused → processing → (onComplete) → idle
 *
 * SpeechRecognition has no native pause, so pause stops the engine and
 * resume starts a new session; final segments accumulate across sessions.
 */
export function useSpeechRecorder({ onComplete }: Options) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionConstructor() !== null,
    () => true,
  );
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const segmentsRef = useRef<string[]>([]);
  const statusRef = useRef<RecordingStatus>("idle");
  const stopTimerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const {
    elapsedMs,
    reset: resetTimer,
    read: readTimer,
  } = useRecordingTimer(status === "recording");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const transition = useCallback((next: RecordingStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const finalize = useCallback(() => {
    if (statusRef.current !== "processing") return;
    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const segments = [...segmentsRef.current];
    onCompleteRef.current({
      segments,
      transcript: segments.join(" "),
      durationMs: readTimer(),
    });
    setInterim("");
    transition("idle");
  }, [readTimer, transition]);

  const handleResult = useCallback((event: SpeechRecognitionEventLike) => {
    let pending = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = result[0]?.transcript.trim() ?? "";
      if (!text) continue;
      if (result.isFinal) segmentsRef.current.push(text);
      else pending += `${text} `;
    }
    setInterim(pending.trim());
  }, []);

  const handleEnd = useCallback(() => {
    const current = statusRef.current;
    // Browsers end continuous sessions after silence; keep listening while recording.
    if (current === "recording") {
      try {
        recognitionRef.current?.start();
      } catch {
        transition("paused");
      }
      return;
    }
    if (current === "processing") finalize();
  }, [finalize, transition]);

  const handleError = useCallback(
    (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(errorMessage(event.error));
      transition("error");
      recognitionRef.current?.abort();
    },
    [transition],
  );

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.lang = SPEECH_LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const start = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;
    segmentsRef.current = [];
    resetTimer();
    setInterim("");
    setError(null);
    transition("requesting");
    // Handlers only touch refs and stable callbacks, so binding once per start is safe.
    recognition.onstart = () => {
      if (statusRef.current === "requesting") transition("recording");
    };
    recognition.onresult = handleResult;
    recognition.onend = handleEnd;
    recognition.onerror = handleError;
    try {
      recognition.start();
    } catch {
      setError(errorMessage("start-failed"));
      transition("error");
    }
  }, [ensureRecognition, handleEnd, handleError, handleResult, resetTimer, transition]);

  const pause = useCallback(() => {
    if (statusRef.current !== "recording") return;
    transition("paused");
    recognitionRef.current?.stop();
  }, [transition]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    transition("recording");
    try {
      recognitionRef.current?.start();
    } catch {
      // already running (stop not yet settled) — keep going
    }
  }, [transition]);

  const stop = useCallback(() => {
    const current = statusRef.current;
    if (current !== "recording" && current !== "paused") return;
    transition("processing");
    if (current === "paused") {
      finalize();
      return;
    }
    recognitionRef.current?.stop();
    // Safety net in case the engine never fires `end`.
    stopTimerRef.current = window.setTimeout(finalize, STOP_TIMEOUT_MS);
  }, [finalize, transition]);

  const dismissError = useCallback(() => {
    setError(null);
    transition("idle");
  }, [transition]);

  useEffect(
    () => () => {
      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
      }
    },
    [],
  );

  return {
    status: supported ? status : ("unsupported" as const),
    elapsedMs,
    interim,
    error,
    start,
    pause,
    resume,
    stop,
    dismissError,
  };
}
