import { SPEECH_LANG } from "@/lib/constants/recording";

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
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
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    const voice = koreanVoice();
    if (voice) utterance.voice = voice;

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(done, 3000 + text.length * 250);
    utterance.onend = done;
    utterance.onerror = done;
    synth.speak(utterance);
  });
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

/**
 * iOS Safari only allows speech after a user gesture; call this from the
 * tap that enables hands-free mode so later prompts can play.
 */
export function primeSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  const utterance = new SpeechSynthesisUtterance("");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}
