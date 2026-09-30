import { z } from "zod";

import { isValidDateKey } from "@/lib/date";

/** Mirrors the backend limit for the memo column. */
export const MAX_MEMO_LENGTH = 1000;

/** 납품일 + free-text memo. */
export const deliverySchema = z.object({
  delivery_date: z
    .string()
    .refine(isValidDateKey, "납품일을 yyyy-mm-dd 형식으로 입력해 주세요."),
  memo: z
    .string()
    .trim()
    .min(1, "메모를 입력해 주세요.")
    .max(MAX_MEMO_LENGTH, `메모는 ${MAX_MEMO_LENGTH}자 이하여야 합니다.`),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
