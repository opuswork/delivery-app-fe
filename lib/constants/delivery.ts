/** 납품종류 choices, in dropdown order. Mirrors the backend DELIVERY_TYPES. */
export const DELIVERY_TYPES = ["런", "두부", "간장"] as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[number];

/** Badge colour per 납품종류 (the 납품처 badge on the calendar uses it). */
export const DELIVERY_TYPE_COLORS: Record<DeliveryType, string> = {
  런: "#1D84C4",
  두부: "#B41DC4",
  간장: "#413742",
};

/** Records saved before 납품종류 existed. */
export const UNTYPED_DELIVERY_COLOR = "#94A3B8";

export function isDeliveryType(value: string): value is DeliveryType {
  return (DELIVERY_TYPES as readonly string[]).includes(value);
}

export function deliveryTypeColor(value: string): string {
  return isDeliveryType(value) ? DELIVERY_TYPE_COLORS[value] : UNTYPED_DELIVERY_COLOR;
}
