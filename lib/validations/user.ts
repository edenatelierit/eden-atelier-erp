import { z } from "zod";

export const USER_ROLE_VALUES = [
  "SUPER_ADMIN",
  "SALES",
  "DESIGNER",
  "FACTORY",
  "INSTALLER",
  "ACCOUNTANT",
] as const;

export const userFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.email("Enter a valid email address."),
  role: z.enum(USER_ROLE_VALUES),
  password: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const emptyUserValues: UserFormValues = {
  name: "",
  email: "",
  role: "SALES",
  password: "",
};
