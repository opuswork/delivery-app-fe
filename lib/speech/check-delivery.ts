import { formatDateKeyKo } from "@/lib/date";
import { deliverySchema, type DeliveryFormValues } from "@/lib/validation/delivery";
import type { ParsedDelivery } from "@/types/recording";

const FIELD_LABELS: Record<string, string> = {
  delivery_date: "납품일",
  memo: "메모",
};
const LABEL_ORDER = ["납품일", "메모"];

export type DeliveryCheck =
  | { ok: true; values: DeliveryFormValues }
  | { ok: false; missing: string[] };

/** Validates parsed speech with the same rules as the confirmation form. */
export function checkParsedDelivery(parsed: ParsedDelivery): DeliveryCheck {
  const result = deliverySchema.safeParse(parsed);
  if (result.success) return { ok: true, values: result.data };
  const missing = new Set(
    result.error.issues.map((issue) => FIELD_LABELS[String(issue.path[0])]),
  );
  return {
    ok: false,
    missing: LABEL_ORDER.filter((label) => missing.has(label)),
  };
}

/** "10월 7일, 홈플러스 1급진간장 1.8리터 10통" — read back after saving. */
export function describeDelivery(values: DeliveryFormValues): string {
  return `${formatDateKeyKo(values.delivery_date)}, ${values.memo}`;
}
