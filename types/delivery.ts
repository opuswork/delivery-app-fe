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

/** Several products for one 납품처 and 납품일; each becomes a DeliveryRecord. */
export interface CreateDeliveryBatchRequest {
  company_name: string;
  delivery_date: string;
  items: Pick<DeliveryRecord, "product_name" | "product_quantity">[];
}

/**
 * Edits one company block: rows with `delivery_number` are updated, rows
 * without are created, rows of `delivery_numbers` left out are deleted.
 * An empty `items` list deletes the whole block.
 */
export interface UpdateDeliveryGroupRequest {
  delivery_numbers: number[];
  company_name: string;
  delivery_date: string;
  items: (Pick<DeliveryRecord, "product_name" | "product_quantity"> & {
    delivery_number?: number;
  })[];
}

/** Delivery records keyed by their yyyy-mm-dd delivery date. */
export type DeliveriesByDate = ReadonlyMap<string, DeliveryRecord[]>;
