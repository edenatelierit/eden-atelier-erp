import { z } from "zod";

function nonNegative(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      message
    );
}

function optionalNonNegative(message: string) {
  return z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      return !Number.isNaN(Number(value)) && Number(value) >= 0;
    }, message);
}

export const inventoryItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().optional(),
  name: z.string().trim().min(2, "Name is required."),
  categoryId: z.string().trim().min(1, "Select a category."),
  unitId: z.string().trim().min(1, "Select a unit."),
  supplierId: z.string().optional(),
  costPrice: nonNegative("Cost price is required."),
  sellingPrice: optionalNonNegative("Selling price must be zero or greater."),
  location: z.string().optional(),
  quantityInStock: nonNegative("Quantity is required."),
  minimumThreshold: nonNegative("Minimum threshold is required."),
});

export type InventoryItemValues = z.infer<typeof inventoryItemSchema>;

export const emptyInventoryItem: InventoryItemValues = {
  id: "",
  sku: "",
  name: "",
  categoryId: "",
  unitId: "",
  supplierId: "",
  costPrice: "0",
  sellingPrice: "",
  location: "",
  quantityInStock: "0",
  minimumThreshold: "0",
};
