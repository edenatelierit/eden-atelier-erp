import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "Client or company name is required."),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().min(6, "Enter a valid phone number."),
  email: z.email("Enter a valid email address."),
  source: z.enum([
    "INSTAGRAM",
    "WORD_OF_MOUTH",
    "WALK_IN",
    "WEBSITE",
    "REFERRAL",
    "OTHER",
  ]),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED"]),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
