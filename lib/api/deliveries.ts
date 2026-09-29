import { apiRequest } from "@/lib/api-client";
import type { CreateDeliveryRequest, DeliveryRecord } from "@/types/delivery";

/** @param month yyyy-mm */
export function listDeliveries(
  month: string,
  signal?: AbortSignal,
): Promise<DeliveryRecord[]> {
  return apiRequest<DeliveryRecord[]>(
    `/deliveries?month=${encodeURIComponent(month)}`,
    { signal },
  );
}

export function createDelivery(
  body: CreateDeliveryRequest,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>("/deliveries", { method: "POST", body });
}
