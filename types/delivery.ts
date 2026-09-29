/** Mirrors the backend DeliveryRecord contract (field names are the business names). */
export interface DeliveryRecord {
  delivery_number: number;
  company_name: string;
  product_name: string;
  product_quantity: string;
  /** yyyy-mm-dd */
  delivery_date: string;
}

export type CreateDeliveryRequest = Omit<DeliveryRecord, "delivery_number">;

/** Delivery records keyed by their yyyy-mm-dd delivery date. */
export type DeliveriesByDate = ReadonlyMap<string, DeliveryRecord[]>;
