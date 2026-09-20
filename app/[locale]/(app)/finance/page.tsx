import type { Metadata } from "next";

import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import type { CategoryOption } from "@/lib/validations/category";

export const metadata: Metadata = {
  title: "Accounting",
};

async function fallbackEmpty<T>(promise: Promise<T>, empty: T) {
  try {
    return await promise;
  } catch (error) {
    if (!isMissingTable(error)) throw error;
    return empty;
  }
}

export default async function FinancePage() {
  await requirePageAccess("/finance");

  const [projects, accounts, categoryRows, transactionRows] = await Promise.all([
    prisma.project.findMany({
      orderBy: { projectNumber: "desc" },
      select: { id: true, projectNumber: true },
    }),
    fallbackEmpty(
      prisma.account.findMany({
        orderBy: [{ type: "asc" }, { name: "asc" }],
      }),
      []
    ),
    fallbackEmpty(
      prisma.category.findMany({
        where: { type: { in: ["EXPENSE", "INCOME"] } },
        orderBy: [{ code: "asc" }, { nameEn: "asc" }],
      }),
      []
    ),
    fallbackEmpty(
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 200,
        include: {
          account: { select: { name: true, currency: true } },
          project: { select: { projectNumber: true } },
          masterCategory: { select: { nameEn: true, nameAr: true } },
        },
      }),
      []
    ),
  ]);

  const mappedCategories: CategoryOption[] = categoryRows.map((item) => ({
    id: item.id,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    type: item.type,
    code: item.code,
    isSystem: item.isSystem,
  }));
  const expenseCategories = mappedCategories.filter((item) => item.type === "EXPENSE");
  const incomeCategories = mappedCategories.filter((item) => item.type === "INCOME");

  return (
    <FinanceWorkspace
      accounts={accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency === "LBP" ? "LBP" : "USD",
      }))}
      transactions={transactionRows.map((item) => ({
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
      incomeCategories={incomeCategories}
    />
  );
}
