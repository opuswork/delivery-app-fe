import { SPEECH_LANG } from "@/lib/constants/recording";
import { isNativeApp } from "@/lib/native/platform";
import { NativeSpeechRecognition } from "@/lib/speech/native-recognition";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

/**
 * Browsers expose the Web Speech API as `SpeechRecognition` or `webkitSpeechRecognition`.
 * The store app's web view has neither, so it uses the phone's recogniser instead.
 */
export function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  if (isNativeApp()) return NativeSpeechRecognition;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function createRecognition(): SpeechRecognitionLike | null {
  const Ctor = getRecognitionConstructor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = SPEECH_LANG;
  // Continuous sessions keep listening through short pauses. Single-utterance
  // sessions restarted after every pause, and words spoken during each restart
  // were lost when people spoke quickly. Android's repeated results are
  // handled by mergeFinalResults instead.
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

/** Errors that just mean "nothing was said" or "we stopped it ourselves". */
export function isBenignSpeechError(code: string): boolean {
  return code === "no-speech" || code === "aborted";
}

export function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return isNativeApp()
        ? "마이크 권한이 필요합니다. 휴대폰 설정에서 말로일정의 마이크와 음성 인식을 허용해 주세요."
        : "마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없습니다.";
    case "network":
      return "음성 인식 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.";
    default:
      return "음성 인식 중 오류가 발생했습니다.";
  }
}

const compact = (text: string) => text.replace(/\s+/g, "");

/**
 * Merges a session's final results into one transcript, for both engines:
 * - desktop Chrome sends separate phrases        → append them
 * - Android Chrome re-sends growing snapshots    → keep the longer one
 * - either may repeat a phrase it already sent   → skip it
 * Comparison ignores spaces ("1급한" vs "1급 한").
 */
export function mergeFinalResults(finals: readonly string[]): string {
  let merged = "";
  for (const text of finals) {
    const next = compact(text);
    const current = compact(merged);
    if (!next) continue;
    if (!merged || next.startsWith(current)) merged = text;
    else if (!current.includes(next)) merged = `${merged} ${text}`;
  }
  return merged;
}

/**
 * Reads one recognition event as { final, pending } for the current session.
 * The full result list is rebuilt on every event instead of appended, so the
 * same speech is never counted twice.
 */
export function readSessionResults(event: SpeechRecognitionEventLike): {
  final: string;
  pending: string;
} {
  const finals: string[] = [];
  let pending = "";
  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    const text = result[0]?.transcript.trim() ?? "";
    if (!text) continue;
    if (result.isFinal) finals.push(text);
    else pending = text;
  }
  return { final: mergeFinalResults(finals), pending };
}
