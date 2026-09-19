import type { Metadata } from "next";
import type { ComponentProps } from "react";

import { InventoryWorkspace } from "@/components/inventory/inventory-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function InventoryPage() {
  await requirePageAccess("/inventory");

  let items: ComponentProps<typeof InventoryWorkspace>["items"] = [];
  let categories: ComponentProps<typeof InventoryWorkspace>["categories"] = [];
  let units: ComponentProps<typeof InventoryWorkspace>["units"] = [];
  let suppliers: ComponentProps<typeof InventoryWorkspace>["suppliers"] = [];

  try {
    const [stock, categoryRows, unitRows, supplierRows] = await Promise.all([
      prisma.inventoryItem.findMany({
        orderBy: { sku: "asc" },
        include: {
          category: { select: { nameEn: true, nameAr: true, code: true } },
          unit: { select: { symbol: true, nameEn: true, nameAr: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.category.findMany({
        where: { type: "INVENTORY" },
        orderBy: [{ code: "asc" }, { nameEn: "asc" }],
      }),
      prisma.unitOfMeasure.findMany({ orderBy: { nameEn: "asc" } }),
      prisma.supplier.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true },
      }),
    ]);

    items = stock.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      categoryId: item.categoryId,
      categoryNameEn: item.category.nameEn,
      categoryNameAr: item.category.nameAr,
      categoryCode: item.category.code,
      unitId: item.unitId,
      unitSymbol: item.unit.symbol,
      unitNameEn: item.unit.nameEn,
      unitNameAr: item.unit.nameAr,
      supplierId: item.supplierId,
      supplierName: item.supplier?.name ?? null,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      location: item.location,
      quantityInStock: item.quantityInStock,
      minimumThreshold: item.minimumThreshold,
    }));
    categories = categoryRows.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      type: item.type,
      code: item.code,
      isSystem: item.isSystem,
    }));
    units = unitRows.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      symbol: item.symbol,
      isSystem: item.isSystem,
    }));
    suppliers = supplierRows;
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  return (
    <InventoryWorkspace
      items={items}
      categories={categories}
      units={units}
      suppliers={suppliers}
    />
  );
}
