import { apiRequest } from "@/lib/api-client";
import type {
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

export function deleteDelivery(deliveryNumber: number): Promise<void> {
  return apiRequest<void>(`/deliveries/${deliveryNumber}`, { method: "DELETE" });
}
