"use server";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  inventoryItemSchema,
  type InventoryItemValues,
} from "@/lib/validations/inventory";

function roundQty(value: number) {
  return Math.round(value * 1000) / 1000;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function requireStockUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage inventory.");
  }
  assertRole(session.user.role, ["FACTORY", "ACCOUNTANT"]);
  return session.user.id;
}

async function nextSku(categoryCode: string) {
  const year = String(new Date().getFullYear()).slice(-2);
  const code = categoryCode.trim().toUpperCase() || "STK";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    const sku = `${code}-${year}-${digits}`;
    const exists = await prisma.inventoryItem.findUnique({
      where: { sku },
      select: { id: true },
    });
    if (!exists) {
      return sku;
    }
  }
  return `${code}-${year}-${Date.now().toString().slice(-4)}`;
}

export async function applyStockDelta(input: {
  userId?: string;
  match: string;
  delta: number;
  reason: string;
  entity: string;
  entityId: string;
}) {
  const label = input.match.trim();
  if (!label || input.delta === 0) {
    return { skipped: true as const };
  }

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { sku: { equals: label, mode: "insensitive" } },
          { name: { equals: label, mode: "insensitive" } },
        ],
      },
    });
    if (!item) {
      return { skipped: true as const };
    }

    const quantityInStock = roundQty(item.quantityInStock + input.delta);
    const record = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantityInStock },
    });

    await writeAuditLog({
      userId: input.userId,
      action: "UPDATE",
      entity: "InventoryItem",
      entityId: record.id,
      details: {
        sku: record.sku,
        name: record.name,
        delta: input.delta,
        quantityInStock,
        reason: input.reason,
        sourceEntity: input.entity,
        sourceEntityId: input.entityId,
      },
    });

    return { success: true as const, id: record.id, quantityInStock };
  } catch (error) {
    if (isMissingTable(error)) {
      return { skipped: true as const };
    }
    throw error;
  }
}

export async function saveInventoryItem(raw: InventoryItemValues) {
  const parsed = inventoryItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid stock item." };
  }

  try {
    const userId = await requireStockUser();
    const existingId = parsed.data.id?.trim();
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true, code: true, type: true, nameEn: true },
    });
    if (!category || category.type !== "INVENTORY") {
      return { error: "Select a valid inventory category." };
    }

    const unit = await prisma.unitOfMeasure.findUnique({
      where: { id: parsed.data.unitId },
      select: { id: true, symbol: true },
    });
    if (!unit) {
      return { error: "Select a valid unit of measure." };
    }

    const supplierId = toOptionalText(parsed.data.supplierId);
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });
      if (!supplier) {
        return { error: "Selected supplier was not found." };
      }
    }

    const requestedSku = parsed.data.sku?.trim().toUpperCase();
    const sku = requestedSku || (await nextSku(category.code));
    const sellingRaw = parsed.data.sellingPrice?.trim();

    const data = {
      sku,
      name: parsed.data.name.trim(),
      categoryId: category.id,
      unitId: unit.id,
      supplierId,
      costPrice: roundMoney(Number(parsed.data.costPrice)),
      sellingPrice: sellingRaw ? roundMoney(Number(sellingRaw)) : null,
      location: toOptionalText(parsed.data.location),
      quantityInStock: roundQty(Number(parsed.data.quantityInStock)),
      minimumThreshold: roundQty(Number(parsed.data.minimumThreshold)),
    };

    const record = existingId
      ? await prisma.inventoryItem.update({
          where: { id: existingId },
          data,
        })
      : await prisma.inventoryItem.create({ data });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "InventoryItem",
      entityId: record.id,
      details: {
        sku: record.sku,
        name: record.name,
        categoryId: record.categoryId,
        categoryCode: category.code,
        unitId: record.unitId,
        unitSymbol: unit.symbol,
        supplierId: record.supplierId,
        costPrice: record.costPrice,
        quantityInStock: record.quantityInStock,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A stock item with this SKU already exists." };
    }
    if (isMissingTable(error)) {
      return { error: "Inventory tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save stock item.";
    return { error: message };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const userId = await requireStockUser();
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, sku: true, name: true },
    });
    if (!existing) {
      return { error: "Stock item not found." };
    }

    await prisma.inventoryItem.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "InventoryItem",
      entityId: id,
      details: { sku: existing.sku, name: existing.name },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Inventory tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete stock item.";
    return { error: message };
  }
}
