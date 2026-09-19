import type { Metadata } from "next";

import { CategorySettings } from "@/components/admin/category-settings";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";

export const metadata: Metadata = {
  title: "Master Categories",
};

function toCategory(item: {
  id: string;
  nameEn: string;
  nameAr: string;
  type: "INVENTORY" | "EXPENSE" | "LEAD_SOURCE";
  code: string;
  isSystem: boolean;
}) {
  return {
    id: item.id,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    type: item.type,
    code: item.code,
    isSystem: item.isSystem,
  };
}

export default async function CategorySettingsPage() {
  await requirePageAccess("/admin/settings");

  let inventoryCategories: ReturnType<typeof toCategory>[] = [];
  let expenseCategories: ReturnType<typeof toCategory>[] = [];
  let units: {
    id: string;
    nameEn: string;
    nameAr: string;
    symbol: string;
    isSystem: boolean;
  }[] = [];

  try {
    const [inventory, expense, unitRows] = await Promise.all([
      prisma.category.findMany({
        where: { type: "INVENTORY" },
        orderBy: [{ code: "asc" }, { nameEn: "asc" }],
      }),
      prisma.category.findMany({
        where: { type: "EXPENSE" },
        orderBy: [{ code: "asc" }, { nameEn: "asc" }],
      }),
      prisma.unitOfMeasure.findMany({
        orderBy: { nameEn: "asc" },
      }),
    ]);
    inventoryCategories = inventory.map(toCategory);
    expenseCategories = expense.map(toCategory);
    units = unitRows.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      symbol: item.symbol,
      isSystem: item.isSystem,
    }));
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  return (
    <CategorySettings
      inventoryCategories={inventoryCategories}
      expenseCategories={expenseCategories}
      units={units}
    />
  );
}
