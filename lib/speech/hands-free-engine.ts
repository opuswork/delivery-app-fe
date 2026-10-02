import {
  checkParsedDelivery,
  describeDelivery,
} from "@/lib/speech/check-delivery";
import { endsWithClosingWord, stripClosingWord } from "@/lib/speech/closing-word";
import { parseDeliveryTranscript } from "@/lib/speech/parse-delivery";
import {
  createRecognition,
  isBenignSpeechError,
  mergeFinalResults,
  readSessionResults,
  speechErrorMessage,
} from "@/lib/speech/recognition";
import { cancelSpeech, speak } from "@/lib/speech/tts";
import { findWakeWord } from "@/lib/speech/wake-word";
import type { DeliveryFormValues } from "@/lib/validation/delivery";
import type { KnownCompanies } from "@/types/delivery";
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

/**
 * Silence before finishing without "끝". People are taught to end with "끝",
 * so this is only a fallback and is long enough for pauses mid-memo.
 */
const SAVE_AFTER_SILENCE_MS = 6000;
/** Silence after an incomplete delivery before asking for the missing part. */
const GIVE_UP_AFTER_SILENCE_MS = 6000;
/**
 * A dictation always finishes after this long, even if background noise keeps
 * the recogniser busy, so the app never stays on "듣고 있어요…".
 */
const MAX_DICTATION_MS = 30_000;
const MAX_ATTEMPTS = 2;
/**
 * "끝" heard in interim (not yet final) speech: save after this short pause.
 * Android can take seconds to finalise a short word, and background noise
 * keeps sending interim results, which would otherwise postpone the save.
 */
const SAVE_AFTER_INTERIM_CLOSING_MS = 500;
/** Short pause before restarting an ended session (lets the engine settle). */
const RESTART_DELAY_MS = 30;

export interface HandsFreeCallbacks {
  onStatus: (status: HandsFreeStatus) => void;
  onLiveText: (text: string) => void;
  onError: (message: string) => void;
  /** Persists the delivery; must throw when saving fails. */
  save: (values: DeliveryFormValues) => Promise<void>;
  /** 납품처 from earlier deliveries (keeps "우리 식당" together). */
  knownCompanies: () => KnownCompanies;
  /**
   * A recording that could not be saved (납품일/납품처 still missing after
   * asking, or the save failed): kept so it can be fixed and saved later.
   */
  keepForLater: (
    transcript: string,
    values: DeliveryFormValues,
    reason: "incomplete" | "save-failed",
  ) => void;
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
  /** The current session's interim (not yet final) text. */
  private pendingText = "";
  private attempts = 0;
  private silenceTimer: number | null = null;
  private restartTimer: number | null = null;
  private dictationTimer: number | null = null;
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
    this.pendingText = "";
    this.attempts = 0;
    this.callbacks.onLiveText("");
    this.setStatus("waiting");
    this.startRecognition();
  }

  private startDictation(): void {
    this.segments = [];
    this.resumeDictation();
  }

  /**
   * Listens again, keeping what was already heard (asking for a missing part).
   * The earlier attempt's "끝" is dropped so it does not end the new one.
   */
  private resumeDictation(): void {
    this.segments = this.segments.map(stripClosingWord).filter(Boolean);
    this.sessionText = "";
    this.pendingText = "";
    this.callbacks.onLiveText(this.segments.join(" "));
    this.setStatus("dictating");
    this.startRecognition();
    this.startDictationLimit();
    this.scheduleEvaluation();
  }

  private startDictationLimit(): void {
    if (this.dictationTimer !== null) window.clearTimeout(this.dictationTimer);
    this.dictationTimer = window.setTimeout(() => void this.evaluate(), MAX_DICTATION_MS);
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
    const stripWake = (text: string) => findWakeWord(text)?.rest ?? text;

    if (this.status === "waiting") {
      // Act on final results only, so "오케이 배달 10월 7일…" in one breath is kept whole.
      const wake = final ? findWakeWord(final) : null;
      if (wake) void this.onWake(wake.rest, stripWake(pending));
      return;
    }
    if (this.status !== "dictating") return;

    if (final) this.sessionText = stripWake(final);
    this.pendingText = stripWake(pending);
    const live = [...this.segments, this.sessionText, this.pendingText];
    this.callbacks.onLiveText(live.filter(Boolean).join(" "));
    this.scheduleEvaluation();
  }

  /** `pending`: interim speech in the same event (e.g. a trailing "끝"). */
  private async onWake(rest: string, pending: string): Promise<void> {
    if (rest) {
      // Delivery spoken in the same breath: skip the prompt. The session keeps
      // running, so its (growing) text stays the session text, not a segment.
      this.segments = [];
      this.sessionText = rest;
      this.pendingText = pending;
      this.setStatus("dictating");
      this.callbacks.onLiveText([rest, pending].filter(Boolean).join(" "));
      this.startDictationLimit();
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

  /**
   * Adds the session's text once (Android can repeat a session's result).
   * With `includePending`, interim speech counts too: used when saving on an
   * interim "끝", so the words just before it are not lost.
   */
  private commitSession({ includePending = false } = {}): void {
    const text = (
      includePending ? mergeFinalResults([this.sessionText, this.pendingText]) : this.sessionText
    ).trim();
    this.sessionText = "";
    this.pendingText = "";
    if (text && text !== this.segments[this.segments.length - 1]) {
      this.segments.push(text);
    }
  }

  private spokenSoFar(): string[] {
    return [...this.segments, this.sessionText].filter(Boolean);
  }

  /**
   * Where "끝" was heard: at the end of the final text (anything interim after
   * it is noise), or so far only in interim speech.
   */
  private closingWord(): "final" | "interim" | null {
    const spoken = this.spokenSoFar();
    if (endsWithClosingWord(spoken.join(" "))) return "final";
    const withPending = mergeFinalResults([...spoken, this.pendingText].filter(Boolean));
    return this.pendingText && endsWithClosingWord(withPending, { interim: true })
      ? "interim"
      : null;
  }

  private scheduleEvaluation(): void {
    if (this.silenceTimer !== null) window.clearTimeout(this.silenceTimer);
    const complete = checkParsedDelivery(this.parse(this.spokenSoFar())).ok;
    let delay = complete ? SAVE_AFTER_SILENCE_MS : GIVE_UP_AFTER_SILENCE_MS;
    if (this.closingWord() === "final") delay = 0;
    else if (this.closingWord() === "interim") delay = SAVE_AFTER_INTERIM_CLOSING_MS;
    this.silenceTimer = window.setTimeout(() => void this.evaluate(), delay);
  }

  private async evaluate(): Promise<void> {
    if (this.status !== "dictating") return;
    this.clearTimers();
    this.commitSession({ includePending: this.closingWord() === "interim" });
    const run = this.run;
    this.recognition?.abort();

    const parsed = this.parse(this.segments);
    const transcript = this.segments.join(" ");
    const check = checkParsedDelivery(parsed);
    if (!check.ok) {
      this.attempts += 1;
      const retry = this.attempts < MAX_ATTEMPTS;
      const heardNothing = this.segments.length === 0;
      const missing = check.missing.join(", ");
      const last = check.missing[check.missing.length - 1] ?? "";
      let message: string;
      if (heardNothing) {
        message = `아무 말도 듣지 못했어요. ${retry ? "다시 말씀해 주세요." : "처음부터 다시 해 주세요."}`;
      } else if (retry) {
        // Keep what was heard; only the missing part needs to be said.
        message = `${missing}${objectParticle(last)} 못 들었어요. ${missing}만 말씀해 주세요.`;
      } else {
        this.callbacks.keepForLater(transcript, parsed, "incomplete");
        message = `${missing}${objectParticle(last)} 못 들어서 저장 안 된 녹음에 보관했어요. 화면에서 고쳐서 저장해 주세요.`;
      }
      this.setStatus("announcing");
      await speak(message);
      if (run !== this.run) return;
      if (retry) this.resumeDictation();
      else this.listenForWakeWord();
      return;
    }

    this.setStatus("saving");
    let message: string;
    try {
      await this.callbacks.save(check.values);
      message = `저장했습니다. ${describeDelivery(check.values)}`;
    } catch {
      this.callbacks.keepForLater(transcript, parsed, "save-failed");
      message = "저장하지 못해서 저장 안 된 녹음에 보관했어요. 나중에 화면에서 저장해 주세요.";
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
    if (this.dictationTimer !== null) window.clearTimeout(this.dictationTimer);
    this.silenceTimer = null;
    this.restartTimer = null;
    this.dictationTimer = null;
  }
}
