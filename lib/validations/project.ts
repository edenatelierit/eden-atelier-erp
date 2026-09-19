import { z } from "zod";

import { PROJECT_AREAS } from "@/lib/project-options";

const areaValues = PROJECT_AREAS.map((area) => area.value) as [
  (typeof PROJECT_AREAS)[number]["value"],
  ...(typeof PROJECT_AREAS)[number]["value"][],
];

export const projectFormSchema = z.object({
  clientId: z.string().min(1, "Select an existing client."),
  location: z.string().trim().min(2, "Location is required."),
  targetBudget: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Enter a valid budget."
    ),
  targetCompletionDate: z.string().optional(),
  preferredStyle: z.string().trim().optional(),
  preferredWood: z.string().trim().optional(),
  preferredStone: z.string().trim().optional(),
  preferredColors: z.string().trim().optional(),
  preferredHardware: z.string().trim().optional(),
  areasIncluded: z.array(z.enum(areaValues)).default([]),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
