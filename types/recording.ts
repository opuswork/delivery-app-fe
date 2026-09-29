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

export interface ParsedDeliveryItem {
  product_name: string;
  product_quantity: string;
}

/**
 * Fields extracted from one recording; empty string when not recognised.
 * One 납품처 and 납품일 with one or more products.
 */
export interface ParsedDelivery {
  company_name: string;
  delivery_date: string;
  items: ParsedDeliveryItem[];
}
