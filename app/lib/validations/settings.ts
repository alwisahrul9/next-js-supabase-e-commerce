import * as z from "zod";

export const settingsSchema = z.object({
  name: z.string().min(2, { message: "settings.nameMin" }),
  email: z.string().email({ message: "settings.emailInvalid" }),
  password: z
    .string()
    .min(6, { message: "settings.passwordMin" })
    .optional()
    .or(z.literal("")),
  image: z.string().nullable().optional(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
