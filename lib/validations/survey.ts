import { z } from "zod";

export const surveyFormSchema = z.object({
  electrical: z.boolean(),
  plumbing: z.boolean(),
  drainage: z.boolean(),
  gas: z.boolean(),
  ac: z.boolean(),
  lighting: z.boolean(),
  elevator: z.boolean(),
  loadingAccess: z.boolean(),
  craneRequired: z.boolean(),
  restrictions: z.string().optional(),
  observations: z.string().optional(),
  photoReferences: z.string().optional(),
  photoUrls: z.array(z.string()),
});

export type SurveyFormValues = z.infer<typeof surveyFormSchema>;

export const emptySurveyValues: SurveyFormValues = {
  electrical: false,
  plumbing: false,
  drainage: false,
  gas: false,
  ac: false,
  lighting: false,
  elevator: false,
  loadingAccess: false,
  craneRequired: false,
  restrictions: "",
  observations: "",
  photoReferences: "",
  photoUrls: [],
};
