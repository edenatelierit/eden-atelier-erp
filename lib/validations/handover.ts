import { z } from "zod";

export const HANDOVER_CHECKS = [
  "woodJoinery",
  "kitchen",
  "wardrobes",
  "stoneWorks",
  "countertops",
  "careInstructions",
  "warrantyProvided",
  "finalDrawings",
] as const;

export type HandoverCheckField = (typeof HANDOVER_CHECKS)[number];

export const handoverCertificateSchema = z.object({
  handoverDate: z.string().trim().min(1, "Handover date is required."),
  woodJoinery: z.boolean(),
  kitchen: z.boolean(),
  wardrobes: z.boolean(),
  stoneWorks: z.boolean(),
  countertops: z.boolean(),
  careInstructions: z.boolean(),
  warrantyProvided: z.boolean(),
  finalDrawings: z.boolean(),
  outstandingItems: z.string().optional(),
  remarks: z.string().optional(),
  photoUrls: z.array(z.string()),
});

export type HandoverCertificateValues = z.infer<
  typeof handoverCertificateSchema
>;

export const emptyHandoverValues: HandoverCertificateValues = {
  handoverDate: "",
  woodJoinery: false,
  kitchen: false,
  wardrobes: false,
  stoneWorks: false,
  countertops: false,
  careInstructions: false,
  warrantyProvided: false,
  finalDrawings: false,
  outstandingItems: "",
  remarks: "",
  photoUrls: [],
};

export const WARRANTY_STATUSES = [
  "UNDER_WARRANTY",
  "CHARGEABLE",
  "TO_BE_ASSESSED",
] as const;

export const SERVICE_STATUSES = [
  "OPEN",
  "WAITING_MATERIAL",
  "COMPLETED",
] as const;

export const serviceRequestSchema = z.object({
  id: z.string().optional(),
  dateReported: z.string().trim().min(1, "Report date is required."),
  issue: z.string().trim().min(2, "Describe the issue."),
  warrantyStatus: z.enum(WARRANTY_STATUSES),
  technician: z.string().trim().min(1, "Technician is required."),
  visitDate: z.string().optional(),
  diagnosis: z.string().optional(),
  status: z.enum(SERVICE_STATUSES),
});

export type ServiceRequestValues = z.infer<typeof serviceRequestSchema>;

export const emptyServiceRequestValues: ServiceRequestValues = {
  id: "",
  dateReported: "",
  issue: "",
  warrantyStatus: "TO_BE_ASSESSED",
  technician: "",
  visitDate: "",
  diagnosis: "",
  status: "OPEN",
};
