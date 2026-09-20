import { z } from "zod";

const money = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, "Enter a valid amount.");

const qty = z
  .string()
  .trim()
  .min(1, "Quantity is required.")
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, "Quantity must be greater than zero.");

export const boqItemSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().trim().min(1, "Item code is required."),
  description: z.string().trim().min(2, "Description is required."),
  material: z.string().trim().min(1, "Material is required."),
  unitId: z.string().trim().min(1, "Select a unit."),
  quantity: qty,
  materialCost: money,
  laborCost: money,
  otherCost: money,
  sellingPrice: money,
});

export type BoqItemValues = z.infer<typeof boqItemSchema>;

export const emptyBoqItemValues: BoqItemValues = {
  id: "",
  itemCode: "",
  description: "",
  material: "",
  unitId: "",
  quantity: "1",
  materialCost: "0",
  laborCost: "0",
  otherCost: "0",
  sellingPrice: "0",
};

export function boqLineTotal(values: {
  quantity: number | string;
  materialCost: number | string;
  laborCost: number | string;
  otherCost: number | string;
}) {
  return (
    (Number(values.materialCost) +
      Number(values.laborCost) +
      Number(values.otherCost)) *
    Number(values.quantity)
  );
}
