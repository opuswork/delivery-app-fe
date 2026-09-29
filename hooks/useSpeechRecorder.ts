"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useRecordingTimer } from "@/hooks/useRecordingTimer";
import {
  createRecognition,
  getRecognitionConstructor,
  isBenignSpeechError,
  readSessionResults,
  speechErrorMessage,
} from "@/lib/speech/recognition";
import type { RecordingResult, RecordingStatus } from "@/types/recording";
import type {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

const STOP_TIMEOUT_MS = 3000;

const noopSubscribe = () => () => {};

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
  /** Final text of the current recognition session; committed once on `end`. */
  const sessionTextRef = useRef("");
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

  /** Adds the finished session's text once (Android can repeat a session's result). */
  const commitSession = useCallback(() => {
    const text = sessionTextRef.current.trim();
    sessionTextRef.current = "";
    const segments = segmentsRef.current;
    if (text && text !== segments[segments.length - 1]) segments.push(text);
  }, []);

  const finalize = useCallback(() => {
    if (statusRef.current !== "processing") return;
    commitSession();
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
  }, [commitSession, readTimer, transition]);

  /**
   * Rebuilds the session text from the full result list on every event instead
   * of appending: Android Chrome re-sends growing snapshots of the same speech,
   * which previously produced "신선유통 신선유통 신선유통 ...".
   */
  const handleResult = useCallback((event: SpeechRecognitionEventLike) => {
    const { final, pending } = readSessionResults(event);
    if (final) sessionTextRef.current = final;
    const live = [...segmentsRef.current, pending || sessionTextRef.current];
    setInterim(live.filter(Boolean).join(" "));
  }, []);

  const handleEnd = useCallback(() => {
    const current = statusRef.current;
    if (current !== "processing") commitSession();
    // One utterance per session: keep listening while still recording.
    if (current === "recording") {
      try {
        recognitionRef.current?.start();
      } catch {
        transition("paused");
      }
      return;
    }
    if (current === "processing") finalize();
  }, [commitSession, finalize, transition]);

  const handleError = useCallback(
    (event: SpeechRecognitionErrorEventLike) => {
      if (isBenignSpeechError(event.error)) return;
      setError(speechErrorMessage(event.error));
      transition("error");
      recognitionRef.current?.abort();
    },
    [transition],
  );

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const recognition = createRecognition();
    if (!recognition) return null;
    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const start = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;
    segmentsRef.current = [];
    sessionTextRef.current = "";
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
      setError(speechErrorMessage("start-failed"));
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
