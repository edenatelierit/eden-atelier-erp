import { z } from "zod";

export const ACCOUNT_TYPES = ["BANK", "CASH", "PETTY_CASH"] as const;
export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;
export const CURRENCIES = ["USD", "LBP"] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number];
export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];
export type CurrencyValue = (typeof CURRENCIES)[number];

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

export const accountFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Account name is required."),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.enum(CURRENCIES),
  balance: moneyString("Enter an opening balance."),
});

export const transactionFormSchema = z
  .object({
    date: z.string().trim().min(1, "Date is required."),
    accountId: z.string().trim().min(1, "Select an account."),
    type: z.enum(TRANSACTION_TYPES),
    currency: z.enum(CURRENCIES),
    categoryId: z.string().optional(),
    category: z.string().optional(),
    amount: z
      .string()
      .trim()
      .min(1, "Amount is required.")
      .refine(
        (value) => !Number.isNaN(Number(value)) && Number(value) > 0,
        "Amount must be greater than zero."
      ),
    exchangeRate: z.string().optional(),
    conversion: z.boolean().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    projectId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.type === "EXPENSE" || value.type === "INCOME") &&
      !value.categoryId?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message:
          value.type === "INCOME"
            ? "Select an income category."
            : "Select an expense category.",
      });
    }
    if (value.type === "TRANSFER" && !(value.category ?? "").trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Category is required.",
      });
    }
    if (value.conversion) {
      const rate = Number(value.exchangeRate);
      if (!value.exchangeRate?.trim() || Number.isNaN(rate) || rate <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["exchangeRate"],
          message: "Enter today's LBP exchange rate.",
        });
      }
    }
  });

export type AccountFormValues = z.infer<typeof accountFormSchema>;
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const emptyAccountValues: AccountFormValues = {
  id: "",
  name: "",
  type: "CASH",
  currency: "USD",
  balance: "0",
};

export const emptyTransactionValues: TransactionFormValues = {
  date: "",
  accountId: "",
  type: "EXPENSE",
  currency: "USD",
  categoryId: "",
  category: "",
  amount: "",
  exchangeRate: "",
  conversion: false,
  reference: "",
  notes: "",
  projectId: "",
};
