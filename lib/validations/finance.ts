import { z } from "zod";

export const PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID"] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STAGE_KEYS = [
  "deposit",
  "production",
  "installation",
  "handover",
] as const;

export type PaymentStageKey = (typeof PAYMENT_STAGE_KEYS)[number];

export const PAYMENT_STAGE_PERCENTS: Record<PaymentStageKey, number> = {
  deposit: 40,
  production: 30,
  installation: 20,
  handover: 10,
};

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function paymentStatus(
  amount: number,
  amountPaid: number
): PaymentStatusValue {
  if (amountPaid <= 0) return "PENDING";
  if (amountPaid + 0.005 >= amount) return "PAID";
  return "PARTIAL";
}

export function paymentBalance(amount: number, amountPaid: number) {
  return Math.max(0, roundMoney(amount - amountPaid));
}

export function splitContractAmounts(total: number) {
  const keys = PAYMENT_STAGE_KEYS;
  const amounts = keys.map((key) =>
    roundMoney((total * PAYMENT_STAGE_PERCENTS[key]) / 100)
  );
  const drift = roundMoney(total - amounts.reduce((sum, value) => sum + value, 0));
  amounts[amounts.length - 1] = roundMoney(amounts[amounts.length - 1] + drift);
  return keys.map((stageName, index) => ({
    stageName,
    percentage: PAYMENT_STAGE_PERCENTS[stageName],
    amount: amounts[index],
    amountPaid: 0,
    balance: amounts[index],
    status: "PENDING" as const,
    sortOrder: index,
  }));
}

export const updatePaymentSchema = z.object({
  id: z.string().trim().min(1, "Payment stage is required."),
  amountPaid: z
    .string()
    .trim()
    .min(1, "Amount paid is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Amount paid must be zero or more."
    ),
  paidDate: z.string().optional(),
  invoiceRef: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentValues = z.infer<typeof updatePaymentSchema>;

export const emptyUpdatePaymentValues: UpdatePaymentValues = {
  id: "",
  amountPaid: "0",
  paidDate: "",
  invoiceRef: "",
  notes: "",
};
