import type { PluginListenerHandle } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

import { SPEECH_LANG } from "@/lib/constants/recording";
import type {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from "@/types/speech";

/** How often to ask the plugin whether it is still listening. */
const POLL_MS = 300;
/** After listening stops, the final result arrives separately; wait this long for it. */
const FINAL_RESULT_WAIT_MS = 1500;
/** Once a result arrives after stopping, end when no more follow within this time. */
const FINAL_RESULT_SETTLE_MS = 300;
/** Nothing was heard: end quickly, no final result is coming. */
const NOTHING_HEARD_WAIT_MS = 300;
/**
 * A pause in speech ends the session so its text becomes final. Android does
 * this itself; iOS would keep listening for up to a minute, and hands-free mode
 * only reacts to final text (e.g. the wake phrase).
 */
const PAUSE_ENDS_SESSION_MS = 1500;
/** iOS refuses to start while the previous session is still shutting down. */
const START_RETRY_MS = 300;

/** Maps plugin error messages (Android and iOS) to Web Speech API error codes. */
function errorCode(message: string): string {
  const text = message.toLowerCase();
  if (/permission|denied|restricted/.test(text)) return "not-allowed";
  if (/network|server/.test(text)) return "network";
  if (/no match|no speech/.test(text)) return "no-speech";
  if (/audio|microphone/.test(text)) return "audio-capture";
  return "start-failed";
}

function resultEvent(text: string, isFinal: boolean): SpeechRecognitionEventLike {
  const result = { isFinal, length: 1, 0: { transcript: text } };
  return {
    resultIndex: 0,
    results: { length: 1, 0: result },
  } as unknown as SpeechRecognitionEventLike;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The browser SpeechRecognition interface, backed by the phone's own speech
 * recogniser: the Android/iOS web views have no Web Speech API.
 *
 * Like the browser engine, a session may end by itself after a pause; callers
 * already restart it while they are still recording.
 *
 * Plugin quirks handled here:
 * - iOS never ends a session after a pause, so we stop it after PAUSE_ENDS_SESSION_MS.
 * - "stopped" is reported before the final result, so we wait for it briefly.
 * - Android reports errors after start() has resolved, where they are lost, so
 *   isListening() is polled to notice that the session has ended.
 * - stop() never resolves on Android, so it is never awaited.
 */
export class NativeSpeechRecognition extends EventTarget implements SpeechRecognitionLike {
  lang = SPEECH_LANG;
  continuous = true;
  interimResults = true;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;

  private active = false;
  private finishing = false;
  /** Bumped per session so late plugin events from an old session are ignored. */
  private session = 0;
  private lastText = "";
  private listeners: PluginListenerHandle[] = [];
  private pollTimer: number | null = null;
  private finishTimer: number | null = null;
  private settleTimer: number | null = null;
  private pauseTimer: number | null = null;

  start(): void {
    if (this.active) throw new DOMException("already started", "InvalidStateError");
    this.active = true;
    this.finishing = false;
    this.lastText = "";
    this.session += 1;
    void this.begin(this.session);
  }

  stop(): void {
    if (!this.active || this.finishing) return;
    void SpeechRecognition.stop().catch(() => undefined);
    this.finish(this.session);
  }

  abort(): void {
    if (!this.active) return;
    void SpeechRecognition.stop().catch(() => undefined);
    this.end(this.session, { keepText: false });
  }

  private async begin(session: number): Promise<void> {
    try {
      const { speechRecognition } = await SpeechRecognition.checkPermissions();
      if (speechRecognition !== "granted") {
        const requested = await SpeechRecognition.requestPermissions();
        if (requested.speechRecognition !== "granted") throw new Error("permission denied");
      }
      if (session !== this.session) return;
      await this.addListeners(session);
      await this.startPlugin();
      if (session !== this.session) {
        // Aborted while starting: stop the plugin unless a newer session owns it.
        if (!this.active) void SpeechRecognition.stop().catch(() => undefined);
        return;
      }
      this.onstart?.();
      this.poll(session);
    } catch (error) {
      if (session !== this.session) return;
      this.onerror?.({ error: errorCode(messageOf(error)) } as SpeechRecognitionErrorEventLike);
      this.end(session, { keepText: false });
    }
  }

  private async startPlugin(): Promise<void> {
    const options = { language: this.lang, maxResults: 1, partialResults: true, popup: false };
    try {
      await SpeechRecognition.start(options);
    } catch (error) {
      if (!/ongoing/i.test(messageOf(error))) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, START_RETRY_MS));
      await SpeechRecognition.start(options);
    }
  }

  private async addListeners(session: number): Promise<void> {
    await this.removeListeners();
    this.listeners = await Promise.all([
      SpeechRecognition.addListener("partialResults", ({ matches }) => {
        if (session !== this.session || !this.active) return;
        const text = matches?.[0]?.trim() ?? "";
        if (!text) return;
        this.lastText = text;
        if (this.finishing) {
          // The final result: end once no further results follow.
          if (this.settleTimer !== null) window.clearTimeout(this.settleTimer);
          this.settleTimer = window.setTimeout(() => this.end(session), FINAL_RESULT_SETTLE_MS);
          return;
        }
        this.onresult?.(resultEvent(text, false));
        if (this.pauseTimer !== null) window.clearTimeout(this.pauseTimer);
        this.pauseTimer = window.setTimeout(() => this.stop(), PAUSE_ENDS_SESSION_MS);
      }),
      SpeechRecognition.addListener("listeningState", ({ status }) => {
        if (status === "stopped") this.finish(session);
      }),
    ]);
  }

  private poll(session: number): void {
    this.pollTimer = window.setTimeout(async () => {
      if (session !== this.session || !this.active || this.finishing) return;
      const { listening } = await SpeechRecognition.isListening().catch(() => ({
        listening: false,
      }));
      if (session !== this.session) return;
      if (listening) this.poll(session);
      else this.finish(session);
    }, POLL_MS);
  }

  /** Listening has stopped; wait for the final result before ending. */
  private finish(session: number): void {
    if (session !== this.session || !this.active || this.finishing) return;
    this.finishing = true;
    const wait = this.lastText ? FINAL_RESULT_WAIT_MS : NOTHING_HEARD_WAIT_MS;
    this.finishTimer = window.setTimeout(() => this.end(session), wait);
  }

  private end(session: number, { keepText = true } = {}): void {
    if (session !== this.session || !this.active) return;
    this.clearTimers();
    this.active = false;
    this.finishing = false;
    this.session += 1;
    const text = this.lastText;
    this.lastText = "";
    void this.removeListeners();
    if (keepText && text) this.onresult?.(resultEvent(text, true));
    // Like the browser engine, `end` arrives asynchronously.
    window.setTimeout(() => this.onend?.(), 0);
  }

  private async removeListeners(): Promise<void> {
    const listeners = this.listeners;
    this.listeners = [];
    await Promise.all(listeners.map((listener) => listener.remove()));
  }

  private clearTimers(): void {
    for (const timer of [this.pollTimer, this.finishTimer, this.settleTimer, this.pauseTimer]) {
      if (timer !== null) window.clearTimeout(timer);
    }
    this.pollTimer = null;
    this.finishTimer = null;
    this.settleTimer = null;
    this.pauseTimer = null;
  }
}
