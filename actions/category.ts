"use server";

import { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { requireAdminUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  categoryFormSchema,
  unitFormSchema,
  type CategoryFormValues,
  type CategoryTypeValue,
  type UnitFormValues,
} from "@/lib/validations/category";

function toCode(value: string) {
  return value.trim().toUpperCase();
}

export async function saveCategory(raw: CategoryFormValues) {
  const parsed = categoryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }

  try {
    const user = await requireAdminUser();
    const existingId = parsed.data.id?.trim();
    const data = {
      type: parsed.data.type,
      nameEn: parsed.data.nameEn.trim(),
      nameAr: parsed.data.nameAr.trim(),
      code: toCode(parsed.data.code),
    };

    if (existingId) {
      const existing = await prisma.category.findUnique({
        where: { id: existingId },
        select: { id: true, isSystem: true, type: true },
      });
      if (!existing) {
        return { error: "Category not found." };
      }
      if (existing.type !== data.type) {
        return { error: "Category type cannot be changed." };
      }
    }

    const record = existingId
      ? await prisma.category.update({
          where: { id: existingId },
          data: {
            nameEn: data.nameEn,
            nameAr: data.nameAr,
            code: data.code,
          },
        })
      : await prisma.category.create({ data });

    await writeAuditLog({
      userId: user.id,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Category",
      entityId: record.id,
      details: {
        type: record.type,
        code: record.code,
        nameEn: record.nameEn,
        nameAr: record.nameAr,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A category with this code already exists." };
    }
    if (isMissingTable(error)) {
      return { error: "Category tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save category.";
    return { error: message };
  }
}

export async function deleteCategory(id: string) {
  try {
    const user = await requireAdminUser();
    const existing = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        nameEn: true,
        type: true,
        isSystem: true,
        _count: { select: { inventoryItems: true, transactions: true } },
      },
    });
    if (!existing) {
      return { error: "Category not found." };
    }
    if (existing.isSystem) {
      return { error: "System categories cannot be deleted." };
    }
    if (existing._count.inventoryItems > 0 || existing._count.transactions > 0) {
      return { error: "This category is in use and cannot be deleted." };
    }

    await prisma.category.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Category",
      entityId: id,
      details: {
        type: existing.type,
        code: existing.code,
        nameEn: existing.nameEn,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Category tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete category.";
    return { error: message };
  }
}

export async function saveUnit(raw: UnitFormValues) {
  const parsed = unitFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid unit." };
  }

  try {
    const user = await requireAdminUser();
    const existingId = parsed.data.id?.trim();
    const data = {
      nameEn: parsed.data.nameEn.trim(),
      nameAr: parsed.data.nameAr.trim(),
      symbol: parsed.data.symbol.trim(),
    };

    const record = existingId
      ? await prisma.unitOfMeasure.update({
          where: { id: existingId },
          data,
        })
      : await prisma.unitOfMeasure.create({ data });

    await writeAuditLog({
      userId: user.id,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "UnitOfMeasure",
      entityId: record.id,
      details: {
        symbol: record.symbol,
        nameEn: record.nameEn,
        nameAr: record.nameAr,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A unit with this symbol already exists." };
    }
    if (isMissingTable(error)) {
      return { error: "Unit tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save unit.";
    return { error: message };
  }
}

export async function deleteUnit(id: string) {
  try {
    const user = await requireAdminUser();
    const existing = await prisma.unitOfMeasure.findUnique({
      where: { id },
      select: {
        id: true,
        symbol: true,
        nameEn: true,
        isSystem: true,
        _count: { select: { inventoryItems: true } },
      },
    });
    if (!existing) {
      return { error: "Unit not found." };
    }
    if (existing.isSystem) {
      return { error: "System units cannot be deleted." };
    }
    if (existing._count.inventoryItems > 0) {
      return { error: "This unit is in use and cannot be deleted." };
    }

    await prisma.unitOfMeasure.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "UnitOfMeasure",
      entityId: id,
      details: { symbol: existing.symbol, nameEn: existing.nameEn },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Unit tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete unit.";
    return { error: message };
  }
}

export async function listCategoriesByType(type: CategoryTypeValue) {
  try {
    return await prisma.category.findMany({
      where: { type },
      orderBy: [{ code: "asc" }, { nameEn: "asc" }],
    });
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
}

export async function listUnits() {
  try {
    return await prisma.unitOfMeasure.findMany({
      orderBy: [{ nameEn: "asc" }],
    });
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
}

export async function seedMasterDefaults() {
  try {
    const user = await requireAdminUser();
    const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_INVENTORY_CATEGORIES, DEFAULT_UNITS } =
      await import("@/lib/master-defaults");

    for (const unit of DEFAULT_UNITS) {
      await prisma.unitOfMeasure.upsert({
        where: { symbol: unit.symbol },
        update: { nameEn: unit.nameEn, nameAr: unit.nameAr, isSystem: true },
        create: { ...unit, isSystem: true },
      });
    }

    for (const item of DEFAULT_INVENTORY_CATEGORIES) {
      await prisma.category.upsert({
        where: { type_code: { type: "INVENTORY", code: item.code } },
        update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
        create: { ...item, type: "INVENTORY", isSystem: true },
      });
    }

    for (const item of DEFAULT_EXPENSE_CATEGORIES) {
      await prisma.category.upsert({
        where: { type_code: { type: "EXPENSE", code: item.code } },
        update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
        create: { ...item, type: "EXPENSE", isSystem: true },
      });
    }

    for (const item of DEFAULT_INCOME_CATEGORIES) {
      await prisma.category.upsert({
        where: { type_code: { type: "INCOME", code: item.code } },
        update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
        create: { ...item, type: "INCOME", isSystem: true },
      });
    }

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "MasterData",
      entityId: "defaults",
      details: {
        units: DEFAULT_UNITS.length,
        inventoryCategories: DEFAULT_INVENTORY_CATEGORIES.length,
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES.length,
        incomeCategories: DEFAULT_INCOME_CATEGORIES.length,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Apply the latest database schema before seeding master data." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to seed master data.";
    return { error: message };
  }
}
