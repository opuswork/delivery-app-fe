import { z } from "zod";

import { isValidDateKey } from "@/lib/date";

/** Mirrors the backend limit for the memo column. */
export const MAX_MEMO_LENGTH = 1000;

/** 납품일 + 납품처 (required) + badge colour + free-text memo (optional). */
export const deliverySchema = z.object({
  delivery_date: z
    .string()
    .refine(isValidDateKey, "납품일을 yyyy-mm-dd 형식으로 입력해 주세요."),
  company_name: z
    .string()
    .trim()
    .min(1, "납품처를 입력해 주세요.")
    .max(100, "납품처는 100자 이하여야 합니다."),
  badge_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "배지 색상을 선택해 주세요."),
  memo: z
    .string()
    .trim()
    .max(MAX_MEMO_LENGTH, `메모는 ${MAX_MEMO_LENGTH}자 이하여야 합니다.`),
});

/** 선택수정: everything except the date, which comes from the selected days. */
export const deliveryContentSchema = deliverySchema.omit({ delivery_date: true });
export type DeliveryContentValues = z.input<typeof deliveryContentSchema>;
export type ValidDeliveryContent = z.output<typeof deliveryContentSchema>;

/** What the form holds (before trimming). */
export type DeliveryFormValues = z.input<typeof deliverySchema>;
/** What passes validation. */
export type ValidDelivery = z.output<typeof deliverySchema>;
