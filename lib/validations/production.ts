import { z } from "zod";

function positiveInt(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      message
    );
}

function nonNegativeNumber(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      message
    );
}

export const cuttingListPartSchema = z.object({
  id: z.string().optional(),
  partNumber: z.string().trim().min(1, "Part is required."),
  description: z.string().trim().min(1, "Description is required."),
  qty: positiveInt("Qty must be a whole number."),
  length: nonNegativeNumber("Enter length."),
  width: nonNegativeNumber("Enter width."),
  thickness: nonNegativeNumber("Enter thickness."),
  material: z.string().trim().min(1, "Material is required."),
  edge1: z.string().optional(),
  edge2: z.string().optional(),
  notes: z.string().optional(),
});

export const cuttingListSchema = z.object({
  parts: z.array(cuttingListPartSchema),
});

export type CuttingListPartValues = z.infer<typeof cuttingListPartSchema>;
export type CuttingListValues = z.infer<typeof cuttingListSchema>;

export const emptyCuttingListPart: CuttingListPartValues = {
  id: "",
  partNumber: "",
  description: "",
  qty: "1",
  length: "",
  width: "",
  thickness: "",
  material: "",
  edge1: "",
  edge2: "",
  notes: "",
};
