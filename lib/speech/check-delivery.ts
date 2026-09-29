import { formatDateKeyKo } from "@/lib/date";
import { deliverySchema, type DeliveryFormValues } from "@/lib/validation/delivery";
import type { ParsedDelivery } from "@/types/recording";

const FIELD_LABELS: Record<keyof DeliveryFormValues, string> = {
  company_name: "납품처",
  product_name: "상품명",
  product_quantity: "수량",
  delivery_date: "납품일",
};

export type DeliveryCheck =
  | { ok: true; values: DeliveryFormValues }
  | { ok: false; missing: string[] };

/** Validates parsed speech with the same rules as the confirmation form. */
export function checkParsedDelivery(parsed: ParsedDelivery): DeliveryCheck {
  const result = deliverySchema.safeParse(parsed);
  if (result.success) return { ok: true, values: result.data };
  const missing = new Set<string>();
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof DeliveryFormValues;
    if (FIELD_LABELS[field]) missing.add(FIELD_LABELS[field]);
  }
  return { ok: false, missing: [...missing] };
}

/** "신선유통, 생명물간장 860밀리리터, 4통, 10월 3일" — read back after saving. */
export function describeDelivery(values: DeliveryFormValues): string {
  return [
    values.company_name,
    values.product_name,
    values.product_quantity,
    formatDateKeyKo(values.delivery_date),
  ].join(", ");
}
