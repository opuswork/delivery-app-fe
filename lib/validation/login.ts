import { z } from "zod";

export const loginSchema = z.object({
  loginId: z.string().regex(/^\d{4}$/, "아이디는 숫자 4자리입니다."),
  password: z.string().regex(/^\d{8}$/, "비밀번호는 숫자 8자리입니다."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
