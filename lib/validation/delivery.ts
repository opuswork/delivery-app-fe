import { z } from "zod";

import { isValidDateKey } from "@/lib/date";

/** Mirrors the backend limit for POST /deliveries/batch. */
export const MAX_DELIVERY_ITEMS = 10;

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .max(max, `${label}은(는) ${max}자 이하여야 합니다.`);

export const deliveryItemSchema = z.object({
  product_name: requiredText("상품명", 100),
  product_quantity: requiredText("수량", 50),
  /** Set when editing an already saved row. */
  delivery_number: z.number().int().positive().optional(),
});

/** One recording: shared 납품처 and 납품일, one or more products. */
export const deliverySchema = z.object({
  company_name: requiredText("납품처", 100),
  delivery_date: z
    .string()
    .refine(isValidDateKey, "납품일을 yyyy-mm-dd 형식으로 입력해 주세요."),
  items: z
    .array(deliveryItemSchema)
    .min(1, "상품을 하나 이상 입력해 주세요.")
    .max(MAX_DELIVERY_ITEMS, `상품은 최대 ${MAX_DELIVERY_ITEMS}개까지 입력할 수 있습니다.`),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
