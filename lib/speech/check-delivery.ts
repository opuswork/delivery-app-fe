import { formatDateKeyKo } from "@/lib/date";
import { deliverySchema, type DeliveryFormValues } from "@/lib/validation/delivery";
import type { ParsedDelivery } from "@/types/recording";

const FIELD_LABELS: Record<string, string> = {
  company_name: "납품처",
  product_name: "상품명",
  product_quantity: "수량",
  delivery_date: "납품일",
  items: "상품명",
};
const LABEL_ORDER = ["납품처", "상품명", "수량", "납품일"];

export type DeliveryCheck =
  | { ok: true; values: DeliveryFormValues }
  | { ok: false; missing: string[] };

/** Validates parsed speech with the same rules as the confirmation form. */
export function checkParsedDelivery(parsed: ParsedDelivery): DeliveryCheck {
  const result = deliverySchema.safeParse(parsed);
  if (result.success) return { ok: true, values: result.data };
  const missing = new Set<string>();
  for (const issue of result.error.issues) {
    // Item errors look like ["items", 1, "product_quantity"]; report the field name.
    const field = String(issue.path[issue.path.length - 1] ?? issue.path[0]);
    const label = FIELD_LABELS[field] ?? FIELD_LABELS[String(issue.path[0])];
    if (label) missing.add(label);
  }
  return {
    ok: false,
    missing: LABEL_ORDER.filter((label) => missing.has(label)),
  };
}

/** "신선유통, 깔끔한국간장 3통, 생명물간장 2박스, 10월 3일" — read back after saving. */
export function describeDelivery(values: DeliveryFormValues): string {
  return [
    values.company_name,
    ...values.items.map((item) => `${item.product_name} ${item.product_quantity}`),
    formatDateKeyKo(values.delivery_date),
  ].join(", ");
}
