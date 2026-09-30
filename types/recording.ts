export type RecordingStatus =
  | "unsupported"
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "processing"
  | "error";

export interface RecordingResult {
  /** Final speech-recognition segments, in the order they were spoken. */
  segments: string[];
  transcript: string;
  durationMs: number;
}

/** Fields extracted from one recording; empty string when not recognised. */
export interface ParsedDelivery {
  delivery_date: string;
  memo: string;
}
