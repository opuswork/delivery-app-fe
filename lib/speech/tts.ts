import { TextToSpeech } from "@capacitor-community/text-to-speech";

import { SPEECH_LANG } from "@/lib/constants/recording";
import { isNativeApp } from "@/lib/native/platform";

/** The store app's web view has no speechSynthesis, so it uses the phone's TTS. */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return isNativeApp() || "speechSynthesis" in window;
}

function koreanVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.replace("_", "-").startsWith("ko"));
}

/**
 * Speaks Korean text and resolves when it has finished (or failed).
 * A timeout guards against engines that never fire `end`.
 */
export function speak(text: string): Promise<void> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(done, 3000 + text.length * 250);

    if (isNativeApp()) {
      TextToSpeech.speak({ text, lang: SPEECH_LANG }).then(done, done);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    const voice = koreanVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = done;
    utterance.onerror = done;
    synth.speak(utterance);
  });
}

export function cancelSpeech(): void {
  if (isNativeApp()) void TextToSpeech.stop().catch(() => undefined);
  else if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

/**
 * iOS Safari only allows speech after a user gesture; call this from the
 * tap that enables hands-free mode so later prompts can play.
 * Native TTS has no such rule.
 */
export function primeSpeech(): void {
  if (isNativeApp() || !isSpeechSynthesisSupported()) return;
  const utterance = new SpeechSynthesisUtterance("");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}
