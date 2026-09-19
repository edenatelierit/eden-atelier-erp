import { z } from "zod";

import { CURRENCIES } from "@/lib/money";
import { PAYMENT_STAGE_KEYS } from "@/lib/validations/finance";

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;
export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];
export type InvoiceCurrencyValue = (typeof CURRENCIES)[number];

function moneyString(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      message
    );
}

export const invoiceFormSchema = z.object({
  id: z.string().optional(),
  issueDate: z.string().trim().min(1, "Issue date is required."),
  dueDate: z.string().trim().min(1, "Due date is required."),
  subtotal: moneyString("Subtotal is required."),
  vat: moneyString("VAT is required."),
  total: moneyString("Total is required."),
  currency: z.enum(CURRENCIES),
  exchangeRateLbp: z
    .string()
    .trim()
    .min(1, "Daily exchange rate is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) > 0,
      "Enter today's LBP rate."
    ),
  mofNumber: z.string().trim().min(1, "MOF number is required."),
  tvaNumber: z.string().trim().min(1, "TVA number is required."),
  crNumber: z.string().trim().min(1, "Commercial register is required."),
  status: z.enum(INVOICE_STATUSES),
  stageName: z.enum(PAYMENT_STAGE_KEYS).optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const emptyInvoiceValues: InvoiceFormValues = {
  id: "",
  issueDate: "",
  dueDate: "",
  subtotal: "",
  vat: "",
  total: "",
  currency: "USD",
  exchangeRateLbp: "",
  mofNumber: "",
  tvaNumber: "",
  crNumber: "",
  status: "DRAFT",
  stageName: "deposit",
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function invoiceVat(subtotal: number) {
  return roundMoney(subtotal * 0.11);
}
