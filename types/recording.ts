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

/** Delivery fields extracted from a transcript; empty string when not recognised. */
export interface ParsedDelivery {
  company_name: string;
  product_name: string;
  product_quantity: string;
  delivery_date: string;
}
