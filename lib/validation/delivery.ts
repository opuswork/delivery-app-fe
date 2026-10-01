import { z } from "zod";

import { isValidDateKey } from "@/lib/date";

/** Mirrors the backend limit for the memo column. */
export const MAX_MEMO_LENGTH = 1000;

/** 납품일 + 납품처 (required) + free-text memo (optional). */
export const deliverySchema = z.object({
  delivery_date: z
    .string()
    .refine(isValidDateKey, "납품일을 yyyy-mm-dd 형식으로 입력해 주세요."),
  company_name: z
    .string()
    .trim()
    .min(1, "납품처를 입력해 주세요.")
    .max(100, "납품처는 100자 이하여야 합니다."),
  memo: z
    .string()
    .trim()
    .max(MAX_MEMO_LENGTH, `메모는 ${MAX_MEMO_LENGTH}자 이하여야 합니다.`),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
