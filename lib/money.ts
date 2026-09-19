export const CURRENCIES = ["USD", "LBP"] as const;
export type AppCurrency = (typeof CURRENCIES)[number];

export const APP_CURRENCY: AppCurrency = "USD";
export const VAT_RATE = 0.11;

export function roundUsd(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundLbp(value: number) {
  return Math.round(value + Number.EPSILON);
}

export function roundByCurrency(value: number, currency: AppCurrency) {
  return currency === "LBP" ? roundLbp(value) : roundUsd(value);
}

export function invoiceVatUsd(subtotalUsd: number) {
  return roundUsd(subtotalUsd * VAT_RATE);
}

export function usdToLbp(usd: number, rate: number) {
  return roundLbp(usd * rate);
}

export function lbpToUsd(lbp: number, rate: number) {
  if (!rate) return 0;
  return roundUsd(lbp / rate);
}

export function toAccountAmount(input: {
  amount: number;
  from: AppCurrency;
  to: AppCurrency;
  exchangeRate?: number | null;
}) {
  const amount = roundByCurrency(input.amount, input.from);
  if (input.from === input.to) {
    return amount;
  }
  const rate = Number(input.exchangeRate);
  if (!rate || rate <= 0) {
    throw new Error("Exchange rate is required for currency conversion.");
  }
  return input.from === "LBP" ? lbpToUsd(amount, rate) : usdToLbp(amount, rate);
}

export function formatMoney(
  value: number | string | null | undefined,
  locale: string = "en",
  currency: AppCurrency = "USD"
) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }

  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "LBP" ? 0 : 2,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(amount);
}

export function formatBudget(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatExchangeRate(value: number | string | null | undefined, locale = "en") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount) || amount <= 0) {
    return "—";
  }
  return amount.toLocaleString(locale === "ar" ? "ar" : "en-US", {
    maximumFractionDigits: 0,
  });
}
