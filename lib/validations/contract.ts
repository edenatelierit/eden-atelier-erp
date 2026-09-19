import { z } from "zod";

export const contractFormSchema = z.object({
  contractValue: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Enter a valid contract value."
    ),
  projectDuration: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  specialConditions: z.string().optional(),
  scopeOfWorkAttached: z.boolean(),
  paymentTermsAgreed: z.boolean(),
  shopDrawingApprovalRequired: z.boolean(),
  materialApprovalRequired: z.boolean(),
  siteReadinessDefined: z.boolean(),
  variationsRequireWrittenApproval: z.boolean(),
  delayTermsIncluded: z.boolean(),
  warrantyTermsIncluded: z.boolean(),
  cancellationTermsIncluded: z.boolean(),
  governingLawReviewed: z.boolean(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

export const emptyContractValues: ContractFormValues = {
  contractValue: "",
  projectDuration: "",
  warrantyPeriod: "",
  specialConditions: "",
  scopeOfWorkAttached: false,
  paymentTermsAgreed: false,
  shopDrawingApprovalRequired: false,
  materialApprovalRequired: false,
  siteReadinessDefined: false,
  variationsRequireWrittenApproval: false,
  delayTermsIncluded: false,
  warrantyTermsIncluded: false,
  cancellationTermsIncluded: false,
  governingLawReviewed: false,
};
