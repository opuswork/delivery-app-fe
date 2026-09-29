import { SPEECH_LANG } from "@/lib/constants/recording";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

/** Browsers expose the Web Speech API as `SpeechRecognition` or `webkitSpeechRecognition`. */
export function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
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
  // Single-utterance sessions avoid Android Chrome's duplicated continuous results.
  recognition.continuous = false;
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
      return "마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없습니다.";
    case "network":
      return "음성 인식 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.";
    default:
      return "음성 인식 중 오류가 발생했습니다.";
  }
}

/**
 * Reads one recognition event as { final, pending } for the current session.
 * The full result list is rebuilt on every event instead of appended: Android
 * Chrome re-sends growing snapshots of the same speech, so the longest final
 * result is the whole utterance.
 */
export function readSessionResults(event: SpeechRecognitionEventLike): {
  final: string;
  pending: string;
} {
  let final = "";
  let pending = "";
  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    const text = result[0]?.transcript.trim() ?? "";
    if (!text) continue;
    if (result.isFinal) {
      if (text.length >= final.length) final = text;
    } else {
      pending = text;
    }
  }
  return { final, pending };
}
