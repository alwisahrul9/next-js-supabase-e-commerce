// lib/validations/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "email.required").email("email.invalid"),
  password: z
    .string()
    .trim()
    .min(1, "password.required")
    .min(6, "password.minLength"),
  role: z.enum(["buyer", "seller"], {
    message: "Role is not valid",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
