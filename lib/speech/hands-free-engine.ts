import {
  checkParsedDelivery,
  describeDelivery,
} from "@/lib/speech/check-delivery";
import { parseDeliveryTranscript } from "@/lib/speech/parse-delivery";
import {
  createRecognition,
  isBenignSpeechError,
  readSessionResults,
  speechErrorMessage,
} from "@/lib/speech/recognition";
import { cancelSpeech, speak } from "@/lib/speech/tts";
import { findWakeWord } from "@/lib/speech/wake-word";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

export type HandsFreeStatus =
  | "off"
  | "waiting" // listening for "오케이 배달"
  | "prompting" // saying "말씀하세요!"
  | "dictating" // listening to the delivery
  | "saving"
  | "announcing"; // reading back the result or asking again

/** Silence after a complete delivery before it is saved. */
const SAVE_AFTER_SILENCE_MS = 1500;
/** Silence after an incomplete delivery before asking again. */
const GIVE_UP_AFTER_SILENCE_MS = 5000;
const MAX_ATTEMPTS = 2;
const RESTART_DELAY_MS = 150;
const CLOSING_WORD = /(?:^|\s)(?:끝|이상)(?:입니다)?[.!]?$/;

export interface HandsFreeCallbacks {
  onStatus: (status: HandsFreeStatus) => void;
  onLiveText: (text: string) => void;
  onError: (message: string) => void;
  /** Persists the delivery; must throw when saving fails. */
  save: (values: DeliveryFormValues) => Promise<void>;
  /** Company names from earlier deliveries (keeps "우리 식당" together). */
  knownCompanies: () => readonly string[];
}

/** 을/를 depending on whether the word ends in a final consonant. */
function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "을" : "를";
}

/**
 * Hands-free loop: wait for the wake phrase → prompt → dictate → auto-save →
 * read back → wait again. Recognition is always stopped while the app speaks
 * so it never hears its own voice.
 */
export class HandsFreeEngine {
  private status: HandsFreeStatus = "off";
  private recognition: SpeechRecognitionLike | null = null;
  private segments: string[] = [];
  private sessionText = "";
  private attempts = 0;
  private silenceTimer: number | null = null;
  private restartTimer: number | null = null;
  /** Bumped on stop() so in-flight async steps can tell they are stale. */
  private run = 0;

  constructor(private readonly callbacks: HandsFreeCallbacks) {}

  /** Returns false when the browser has no speech recognition. */
  start(): boolean {
    if (this.status !== "off") return true;
    const recognition = createRecognition();
    if (!recognition) return false;
    recognition.onresult = (event) => this.handleResult(event);
    recognition.onend = () => this.handleEnd();
    recognition.onerror = (event) => this.handleError(event);
    this.recognition = recognition;
    this.run += 1;
    this.listenForWakeWord();
    return true;
  }

  stop(): void {
    this.run += 1;
    this.clearTimers();
    cancelSpeech();
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.abort();
    }
    this.callbacks.onLiveText("");
    this.setStatus("off");
  }

  private setStatus(status: HandsFreeStatus): void {
    this.status = status;
    this.callbacks.onStatus(status);
  }

  private listenForWakeWord(): void {
    this.segments = [];
    this.sessionText = "";
    this.attempts = 0;
    this.callbacks.onLiveText("");
    this.setStatus("waiting");
    this.startRecognition();
  }

  private startDictation(): void {
    this.segments = [];
    this.sessionText = "";
    this.callbacks.onLiveText("");
    this.setStatus("dictating");
    this.startRecognition();
    this.scheduleEvaluation();
  }

  private startRecognition(): void {
    try {
      this.recognition?.start();
    } catch {
      // Already running (a previous session has not settled yet).
    }
  }

  private handleResult(event: SpeechRecognitionEventLike): void {
    const { final, pending } = readSessionResults(event);

    if (this.status === "waiting") {
      // Act on final results only, so "오케이 배달 신선유통…" in one breath is kept whole.
      const wake = final ? findWakeWord(final) : null;
      if (wake) void this.onWake(wake.rest);
      return;
    }
    if (this.status !== "dictating") return;

    const stripWake = (text: string) => findWakeWord(text)?.rest ?? text;
    if (final) this.sessionText = stripWake(final);
    const live = [...this.segments, stripWake(pending) || this.sessionText];
    this.callbacks.onLiveText(live.filter(Boolean).join(" "));
    this.scheduleEvaluation();
  }

  private async onWake(rest: string): Promise<void> {
    if (rest) {
      // Delivery spoken in the same breath: skip the prompt.
      this.segments = [rest];
      this.sessionText = "";
      this.setStatus("dictating");
      this.callbacks.onLiveText(rest);
      this.scheduleEvaluation();
      return;
    }
    const run = this.run;
    this.setStatus("prompting");
    this.recognition?.abort();
    await speak("말씀하세요!");
    if (run === this.run) this.startDictation();
  }

  private handleEnd(): void {
    if (this.status === "dictating") this.commitSession();
    if (this.status !== "waiting" && this.status !== "dictating") return;
    // Single-utterance sessions end after each pause; keep listening.
    const run = this.run;
    if (this.restartTimer !== null) window.clearTimeout(this.restartTimer);
    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = null;
      if (run === this.run) this.startRecognition();
    }, RESTART_DELAY_MS);
  }

  private handleError(event: SpeechRecognitionErrorEventLike): void {
    if (isBenignSpeechError(event.error)) return;
    this.callbacks.onError(speechErrorMessage(event.error));
    this.stop();
  }

  /** Adds the finished session's text once (Android can repeat a session's result). */
  private commitSession(): void {
    const text = this.sessionText.trim();
    this.sessionText = "";
    if (text && text !== this.segments[this.segments.length - 1]) {
      this.segments.push(text);
    }
  }

  private spokenSoFar(): string[] {
    return [...this.segments, this.sessionText].filter(Boolean);
  }

  private scheduleEvaluation(): void {
    if (this.silenceTimer !== null) window.clearTimeout(this.silenceTimer);
    const spoken = this.spokenSoFar();
    const complete = checkParsedDelivery(this.parse(spoken)).ok;
    const saidDone = CLOSING_WORD.test(spoken.join(" "));
    const delay = saidDone ? 0 : complete ? SAVE_AFTER_SILENCE_MS : GIVE_UP_AFTER_SILENCE_MS;
    this.silenceTimer = window.setTimeout(() => void this.evaluate(), delay);
  }

  private async evaluate(): Promise<void> {
    if (this.status !== "dictating") return;
    this.clearTimers();
    this.commitSession();
    const run = this.run;
    this.recognition?.abort();

    const check = checkParsedDelivery(this.parse(this.segments));
    if (!check.ok) {
      this.attempts += 1;
      const retry = this.attempts < MAX_ATTEMPTS;
      const last = check.missing[check.missing.length - 1] ?? "";
      const problem =
        this.segments.length === 0
          ? "아무 말도 듣지 못했어요."
          : `${check.missing.join(", ")}${objectParticle(last)} 못 들었어요.`;
      this.setStatus("announcing");
      await speak(`${problem} ${retry ? "다시 말씀해 주세요." : "처음부터 다시 해 주세요."}`);
      if (run !== this.run) return;
      if (retry) this.startDictation();
      else this.listenForWakeWord();
      return;
    }

    this.setStatus("saving");
    let message: string;
    try {
      await this.callbacks.save(check.values);
      message = `저장했습니다. ${describeDelivery(check.values)}`;
    } catch {
      message = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
    }
    if (run !== this.run) return;
    this.setStatus("announcing");
    await speak(message);
    if (run === this.run) this.listenForWakeWord();
  }

  private parse(spoken: readonly string[]) {
    return parseDeliveryTranscript(spoken, new Date(), this.callbacks.knownCompanies());
  }

  private clearTimers(): void {
    if (this.silenceTimer !== null) window.clearTimeout(this.silenceTimer);
    if (this.restartTimer !== null) window.clearTimeout(this.restartTimer);
    this.silenceTimer = null;
    this.restartTimer = null;
  }
}
