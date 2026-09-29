import { apiRequest } from "@/lib/api-client";
import type {
  CreateDeliveryBatchRequest,
  CreateDeliveryRequest,
  DeliveryRecord,
  UpdateDeliveryGroupRequest,
} from "@/types/delivery";

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

/** Saves all products of one recording together (all-or-nothing). */
export function createDeliveryBatch(
  body: CreateDeliveryBatchRequest,
): Promise<DeliveryRecord[]> {
  return apiRequest<DeliveryRecord[]>("/deliveries/batch", { method: "POST", body });
}

/** Edits or deletes (empty items) one company block, all-or-nothing. */
export function updateDeliveryGroup(
  body: UpdateDeliveryGroupRequest,
): Promise<DeliveryRecord[]> {
  return apiRequest<DeliveryRecord[]>("/deliveries/group", { method: "PUT", body });
}
