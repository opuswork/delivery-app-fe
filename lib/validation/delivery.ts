import { z } from "zod";

import { isValidDateKey } from "@/lib/date";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .max(max, `${label}은(는) ${max}자 이하여야 합니다.`);

export const deliverySchema = z.object({
  company_name: requiredText("납품처", 100),
  product_name: requiredText("상품명", 100),
  product_quantity: requiredText("수량", 50),
  delivery_date: z
    .string()
    .refine(isValidDateKey, "납품일을 yyyy-mm-dd 형식으로 입력해 주세요."),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
