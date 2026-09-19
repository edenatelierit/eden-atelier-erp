import { z } from "zod";

export const CATEGORY_TYPES = ["INVENTORY", "EXPENSE", "LEAD_SOURCE"] as const;
export type CategoryTypeValue = (typeof CATEGORY_TYPES)[number];

const codeSchema = z
  .string()
  .trim()
  .min(1, "Code is required.")
  .max(12, "Use a short code.")
  .regex(/^[A-Za-z0-9]+$/, "Use letters and numbers only.");

export const categoryFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(CATEGORY_TYPES),
  nameEn: z.string().trim().min(2, "English name is required."),
  nameAr: z.string().trim().min(2, "Arabic name is required."),
  code: codeSchema,
});

export const unitFormSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().trim().min(1, "English name is required."),
  nameAr: z.string().trim().min(1, "Arabic name is required."),
  symbol: z.string().trim().min(1, "Symbol is required.").max(16, "Symbol is too long."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type UnitFormValues = z.infer<typeof unitFormSchema>;

export const emptyCategoryValues: CategoryFormValues = {
  id: "",
  type: "INVENTORY",
  nameEn: "",
  nameAr: "",
  code: "",
};

export const emptyUnitValues: UnitFormValues = {
  id: "",
  nameEn: "",
  nameAr: "",
  symbol: "",
};

export type CategoryOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  type: CategoryTypeValue;
  code: string;
  isSystem: boolean;
};

export type UnitOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  symbol: string;
  isSystem: boolean;
};
