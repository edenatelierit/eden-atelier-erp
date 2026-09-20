"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import {
  roundByCurrency,
  toAccountAmount,
  type AppCurrency,
} from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  accountFormSchema,
  transactionFormSchema,
  type AccountFormValues,
  type TransactionFormValues,
} from "@/lib/validations/accounting";

function balanceDelta(type: TransactionFormValues["type"], amount: number) {
  if (type === "INCOME") return amount;
  return -amount;
}

async function requireAccountant() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage the cashbook.");
  }
  assertRole(session.user.role, ["ACCOUNTANT"]);
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveAccount(raw: AccountFormValues) {
  const parsed = accountFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid account." };
  }

  try {
    const userId = await requireAccountant();
    const existingId = parsed.data.id?.trim();
    const currency = parsed.data.currency;
    const data = {
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      currency,
      balance: roundByCurrency(Number(parsed.data.balance), currency),
    };

    const record = existingId
      ? await prisma.account.update({
          where: { id: existingId },
          data: {
            name: data.name,
            type: data.type,
            currency: data.currency,
          },
        })
      : await prisma.account.create({ data });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Account",
      entityId: record.id,
      details: {
        name: record.name,
        type: record.type,
        currency: record.currency,
        balance: record.balance,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Cashbook tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save account.";
    return { error: message };
  }
}

export async function createTransaction(raw: TransactionFormValues) {
  const parsed = transactionFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transaction.",
    };
  }

  try {
    const userId = await requireAccountant();
    const currency = parsed.data.currency;
    const amount = roundByCurrency(Number(parsed.data.amount), currency);
    const projectId = toOptionalText(parsed.data.projectId);
    const exchangeRate = parsed.data.exchangeRate?.trim()
      ? Number(parsed.data.exchangeRate)
      : null;
    const categoryId =
      parsed.data.type === "EXPENSE" || parsed.data.type === "INCOME"
        ? parsed.data.categoryId?.trim()
        : null;
    let categoryLabel =
      parsed.data.type === "TRANSFER"
        ? parsed.data.category?.trim() || "Transfer"
        : "";

    if (parsed.data.type === "EXPENSE" || parsed.data.type === "INCOME") {
      const expectedType = parsed.data.type;
      if (!categoryId) {
        return {
          error:
            expectedType === "INCOME"
              ? "Select an income category."
              : "Select an expense category.",
        };
      }
      const masterCategory = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, type: true, nameEn: true, code: true },
      });
      if (!masterCategory || masterCategory.type !== expectedType) {
        return {
          error:
            expectedType === "INCOME"
              ? "Select a valid income category."
              : "Select a valid expense category.",
        };
      }
      categoryLabel = masterCategory.nameEn;
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) {
        return { error: "Selected project was not found." };
      }
    }

    const posted = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: parsed.data.accountId },
      });
      if (!account) {
        throw new Error("Account not found.");
      }

      const accountCurrency = account.currency as AppCurrency;
      if (currency !== accountCurrency && (!exchangeRate || exchangeRate <= 0)) {
        throw new Error("Enter today's LBP exchange rate for conversion.");
      }

      const postedAmount = toAccountAmount({
        amount,
        from: currency,
        to: accountCurrency,
        exchangeRate,
      });
      const nextBalance = roundByCurrency(
        account.balance + balanceDelta(parsed.data.type, postedAmount),
        accountCurrency
      );

      const record = await tx.transaction.create({
        data: {
          date: new Date(`${parsed.data.date}T00:00:00.000Z`),
          type: parsed.data.type,
          category: categoryLabel,
          categoryId,
          amount,
          currency,
          exchangeRate: exchangeRate && exchangeRate > 0 ? exchangeRate : null,
          reference: toOptionalText(parsed.data.reference),
          notes: toOptionalText(parsed.data.notes),
          accountId: account.id,
          projectId,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { balance: nextBalance },
      });

      return {
        record,
        accountName: account.name,
        accountCurrency,
        nextBalance,
        postedAmount,
      };
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "Transaction",
      entityId: posted.record.id,
      details: {
        accountId: posted.record.accountId,
        accountName: posted.accountName,
        type: posted.record.type,
        category: posted.record.category,
        categoryId: posted.record.categoryId,
        amount: posted.record.amount,
        currency: posted.record.currency,
        exchangeRate: posted.record.exchangeRate,
        postedAmount: posted.postedAmount,
        accountCurrency: posted.accountCurrency,
        projectId,
        balance: posted.nextBalance,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: posted.record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Cashbook tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to post transaction.";
    return { error: message };
  }
}
