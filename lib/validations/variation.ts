import { z } from "zod";

export const VARIATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type VariationStatusValue = (typeof VARIATION_STATUSES)[number];

function moneyString(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)), message);
}

export const variationOrderSchema = z.object({
  date: z.string().trim().min(1, "Date is required."),
  requestedBy: z.string().trim().min(2, "Requested by is required."),
  originalContractValue: moneyString("Original contract value is required."),
  scopeVariation: z.string().trim().min(2, "Scope variation is required."),
  reason: z.string().trim().min(2, "Reason is required."),
  costImpact: moneyString("Cost impact is required."),
  timeImpactDays: z
    .string()
    .trim()
    .min(1, "Time impact is required.")
    .refine(
      (value) => Number.isInteger(Number(value)),
      "Time impact must be a whole number of days."
    ),
});

export const variationStatusSchema = z.object({
  id: z.string().trim().min(1, "Variation is required."),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type VariationOrderValues = z.infer<typeof variationOrderSchema>;
export type VariationStatusValues = z.infer<typeof variationStatusSchema>;

export const emptyVariationValues: VariationOrderValues = {
  date: "",
  requestedBy: "",
  originalContractValue: "",
  scopeVariation: "",
  reason: "",
  costImpact: "0",
  timeImpactDays: "0",
};

export function revisedContractValue(
  originalContractValue: string,
  costImpact: string
) {
  const original = Number(originalContractValue);
  const impact = Number(costImpact);
  if (Number.isNaN(original) || Number.isNaN(impact)) {
    return "";
  }
  return (Math.round((original + impact) * 100) / 100).toFixed(2);
}
