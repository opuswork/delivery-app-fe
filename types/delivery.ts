/** Mirrors the backend DeliveryRecord contract (field names are the business names). */
export interface DeliveryRecord {
  delivery_number: number;
  /** 납품일, yyyy-mm-dd */
  delivery_date: string;
  /** 납품처, e.g. "홈플러스" (empty for records saved before it was its own field) */
  company_name: string;
  /** 납품처 badge colour, #RRGGBB ("" = the default colour) */
  badge_color: string;
  /** Free text, may be empty, e.g. "1급진간장 1.8리터 10통" */
  memo: string;
}

export type DeliveryRequest = Omit<DeliveryRecord, "delivery_number">;

/** One delivery copied onto several dates (calendar "반복"). */
export interface RepeatDeliveryRequest extends Omit<DeliveryRequest, "delivery_date"> {
  delivery_dates: string[];
}

export interface RepeatDeliveryResult {
  created: number;
  /** Dates that already had the same delivery. */
  skipped_dates: string[];
}

/** 선택수정: the same 납품처 / badge colour / 메모 written to several saved deliveries. */
export interface BulkUpdateDeliveryRequest extends Omit<DeliveryRequest, "delivery_date"> {
  delivery_numbers: number[];
}

/** Delivery records keyed by their yyyy-mm-dd delivery date. */
export type DeliveriesByDate = ReadonlyMap<string, DeliveryRecord[]>;

/** 납품처 seen before → the badge colour last used with it. */
export type KnownCompanies = ReadonlyMap<string, string>;
