import { apiRequest } from "@/lib/api-client";
import type {
  BulkUpdateDeliveryRequest,
  DeliveryRecord,
  DeliveryRequest,
  RepeatDeliveryRequest,
  RepeatDeliveryResult,
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

export function createDelivery(body: DeliveryRequest): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>("/deliveries", { method: "POST", body });
}

export function updateDelivery(
  deliveryNumber: number,
  body: DeliveryRequest,
): Promise<DeliveryRecord> {
  return apiRequest<DeliveryRecord>(`/deliveries/${deliveryNumber}`, {
    method: "PUT",
    body,
  });
}

export function repeatDelivery(body: RepeatDeliveryRequest): Promise<RepeatDeliveryResult> {
  return apiRequest<RepeatDeliveryResult>("/deliveries/repeat", { method: "POST", body });
}

/** Every saved delivery to the same 납품처 as `deliveryNumber` (선택수정 candidates). */
export function listSameCompanyDeliveries(
  deliveryNumber: number,
  signal?: AbortSignal,
): Promise<DeliveryRecord[]> {
  return apiRequest<DeliveryRecord[]>(`/deliveries/${deliveryNumber}/same-company`, { signal });
}

export function bulkUpdateDeliveries(
  body: BulkUpdateDeliveryRequest,
): Promise<{ updated: number }> {
  return apiRequest<{ updated: number }>("/deliveries/bulk", { method: "PUT", body });
}

export function deleteDelivery(deliveryNumber: number): Promise<void> {
  return apiRequest<void>(`/deliveries/${deliveryNumber}`, { method: "DELETE" });
}
