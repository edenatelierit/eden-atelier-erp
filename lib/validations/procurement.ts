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

export const purchaseOrderLineSchema = z.object({
  id: z.string().optional(),
  poNumber: z.string().optional(),
  item: z.string().trim().min(1, "Item is required."),
  description: z.string().trim().min(1, "Description is required."),
  specification: z.string().trim().min(1, "Specification is required."),
  qty: positiveInt("Qty must be a whole number."),
  unit: z.string().trim().min(1, "Unit is required."),
  unitPrice: nonNegativeNumber("Enter a unit price."),
  requiredDate: z.string().trim().min(1, "Required date is required."),
  deliveryLocation: z.string().trim().min(1, "Delivery location is required."),
  remarks: z.string().optional(),
  supplierId: z.string().trim().min(1, "Select a supplier."),
});

export const purchaseOrderListSchema = z.object({
  orders: z.array(purchaseOrderLineSchema),
});

export const receivingNoteSchema = z.object({
  purchaseOrderId: z.string().trim().min(1, "Select a purchase order."),
  receivedQty: positiveInt("Received quantity must be a whole number."),
  condition: z.enum(["GOOD", "PARTIAL", "DAMAGED"]),
  shortageDamage: z.string().trim().min(1, "Note shortage or damage, or write none."),
  checkedBy: z.string().trim().min(1, "Checked by is required."),
  date: z.string().trim().min(1, "Date is required."),
});

export type PurchaseOrderLineValues = z.infer<typeof purchaseOrderLineSchema>;
export type PurchaseOrderListValues = z.infer<typeof purchaseOrderListSchema>;
export type ReceivingNoteValues = z.infer<typeof receivingNoteSchema>;

export const emptyPurchaseOrderLine: PurchaseOrderLineValues = {
  id: "",
  poNumber: "",
  item: "",
  description: "",
  specification: "",
  qty: "1",
  unit: "pcs",
  unitPrice: "",
  requiredDate: "",
  deliveryLocation: "",
  remarks: "",
  supplierId: "",
};

export const emptyReceivingNoteValues: ReceivingNoteValues = {
  purchaseOrderId: "",
  receivedQty: "1",
  condition: "GOOD",
  shortageDamage: "",
  checkedBy: "",
  date: "",
};
