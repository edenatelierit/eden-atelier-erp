import { z } from "zod";

export const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
] as const;

export const quotationFormSchema = z.object({
  scopeSummary: z.string().trim().min(2, "Scope summary is required."),
  subtotal: z
    .string()
    .trim()
    .min(1, "Subtotal is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Enter a valid subtotal."
    ),
  vat: z
    .string()
    .trim()
    .min(1, "VAT is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Enter a valid VAT amount."
    ),
  total: z
    .string()
    .trim()
    .min(1, "Total is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Enter a valid total."
    ),
  paymentTerms: z.string().trim().min(2, "Payment terms are required."),
  leadTimeWeeks: z
    .string()
    .trim()
    .min(1, "Lead time is required.")
    .refine(
      (value) =>
        Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 104,
      "Enter lead time in weeks."
    ),
  validUntil: z.string().trim().min(1, "Validity date is required."),
  status: z.enum(QUOTATION_STATUSES),
  kitchenScopeIncluded: z.boolean(),
  stoneScopeIncluded: z.boolean(),
  exclusionsListed: z.boolean(),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export const emptyQuotationValues: QuotationFormValues = {
  scopeSummary: "",
  subtotal: "",
  vat: "",
  total: "",
  paymentTerms: "40% deposit, 40% on delivery, 20% on completion",
  leadTimeWeeks: "8",
  validUntil: "",
  status: "DRAFT",
  kitchenScopeIncluded: false,
  stoneScopeIncluded: false,
  exclusionsListed: false,
};
