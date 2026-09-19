import { z } from "zod";

export const SUPPLIER_CATEGORIES = [
  "WOOD",
  "STONE",
  "HARDWARE",
  "GENERAL",
] as const;

export type SupplierCategoryValue = (typeof SUPPLIER_CATEGORIES)[number];

export const supplierFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Supplier name is required."),
  category: z.enum(SUPPLIER_CATEGORIES),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid email address."
    ),
  paymentTerms: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const emptySupplierValues: SupplierFormValues = {
  id: "",
  name: "",
  category: "GENERAL",
  contactPerson: "",
  phone: "",
  email: "",
  paymentTerms: "",
};

export type SupplierOption = {
  id: string;
  name: string;
  category: SupplierCategoryValue;
};
