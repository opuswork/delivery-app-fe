/** Mirrors the backend DeliveryRecord contract (field names are the business names). */
export interface DeliveryRecord {
  delivery_number: number;
  /** 납품일, yyyy-mm-dd */
  delivery_date: string;
  /** Free text, e.g. "홈플러스 1급진간장 1.8리터 10통" */
  memo: string;
}

export type DeliveryRequest = Omit<DeliveryRecord, "delivery_number">;

/** Delivery records keyed by their yyyy-mm-dd delivery date. */
export type DeliveriesByDate = ReadonlyMap<string, DeliveryRecord[]>;
