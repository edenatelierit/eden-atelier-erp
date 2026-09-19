import type { Metadata } from "next";

import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import type { CategoryOption } from "@/lib/validations/category";

export const metadata: Metadata = {
  title: "Accounting",
};

export default async function FinancePage() {
  await requirePageAccess("/finance");

  const projects = await prisma.project.findMany({
    orderBy: { projectNumber: "desc" },
    select: { id: true, projectNumber: true },
  });

  let accounts: Awaited<ReturnType<typeof prisma.account.findMany>> = [];
  let expenseCategories: CategoryOption[] = [];
  let transactions: {
    id: string;
    date: Date;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    category: string;
    categoryId: string | null;
    amount: number;
    currency: "USD" | "LBP";
    exchangeRate: number | null;
    account: { name: string; currency: "USD" | "LBP" };
    project: { projectNumber: string } | null;
    masterCategory: { nameEn: string; nameAr: string } | null;
  }[] = [];

  try {
    accounts = await prisma.account.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  try {
    const rows = await prisma.category.findMany({
      where: { type: "EXPENSE" },
      orderBy: [{ code: "asc" }, { nameEn: "asc" }],
    });
    expenseCategories = rows.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      type: item.type,
      code: item.code,
      isSystem: item.isSystem,
    }));
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  try {
    const rows = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: {
        account: { select: { name: true, currency: true } },
        project: { select: { projectNumber: true } },
        masterCategory: { select: { nameEn: true, nameAr: true } },
      },
    });
    transactions = rows.map((item) => ({
      ...item,
      masterCategory: item.masterCategory
        ? {
            nameEn: item.masterCategory.nameEn,
            nameAr: item.masterCategory.nameAr,
          }
        : null,
    }));
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  return (
    <FinanceWorkspace
      accounts={accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency === "LBP" ? "LBP" : "USD",
      }))}
      transactions={transactions.map((item) => ({
        id: item.id,
        date: item.date.toISOString().slice(0, 10),
        type: item.type,
        category: item.category,
        categoryId: item.categoryId,
        categoryNameEn: item.masterCategory?.nameEn ?? null,
        categoryNameAr: item.masterCategory?.nameAr ?? null,
        amount: item.amount,
        currency: item.currency === "LBP" ? "LBP" : "USD",
        exchangeRate: item.exchangeRate,
        accountName: item.account.name,
        accountCurrency: item.account.currency === "LBP" ? "LBP" : "USD",
        projectNumber: item.project?.projectNumber ?? null,
      }))}
      projects={projects}
      expenseCategories={expenseCategories}
    />
  );
}
