"use server";

import { applyStockDelta } from "@/actions/inventory";
import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  purchaseOrderLineSchema,
  purchaseOrderListSchema,
  receivingNoteSchema,
  type PurchaseOrderLineValues,
  type PurchaseOrderListValues,
  type ReceivingNoteValues,
} from "@/lib/validations/procurement";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage procurement.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function lineTotal(qty: number, unitPrice: number) {
  return Number((qty * unitPrice).toFixed(2));
}

async function allocatePoNumbers(count: number) {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `PO-${year}-`;
  const latest = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
    select: { poNumber: true },
  });

  let sequence = latest
    ? Number(latest.poNumber.slice(prefix.length)) + 1
    : 1;

  return Array.from({ length: count }, () => {
    const value = `${prefix}${String(sequence).padStart(3, "0")}`;
    sequence += 1;
    return value;
  });
}

function serializeOrder(order: {
  id: string;
  poNumber: string;
  item: string;
  description: string;
  specification: string;
  qty: number;
  unit: string;
  unitPrice: number;
  requiredDate: Date;
  deliveryLocation: string;
  remarks: string | null;
  supplierId: string | null;
}): PurchaseOrderLineValues {
  return {
    id: order.id,
    poNumber: order.poNumber,
    item: order.item,
    description: order.description,
    specification: order.specification,
    qty: String(order.qty),
    unit: order.unit,
    unitPrice: String(order.unitPrice),
    requiredDate: order.requiredDate.toISOString().slice(0, 10),
    deliveryLocation: order.deliveryLocation,
    remarks: order.remarks ?? "",
    supplierId: order.supplierId ?? "",
  };
}

export async function savePurchaseOrders(
  projectId: string,
  raw: PurchaseOrderListValues
) {
  const parsed = purchaseOrderListSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid purchase order data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        purchaseOrders: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const existingIds = new Set(project.purchaseOrders.map((order) => order.id));

    const incoming = parsed.data.orders.map((order) => ({
      id: order.id?.trim() || undefined,
      poNumber: order.poNumber?.trim() || undefined,
      item: order.item.trim(),
      description: order.description.trim(),
      specification: order.specification.trim(),
      qty: Number(order.qty),
      unit: order.unit.trim(),
      unitPrice: Number(order.unitPrice),
      requiredDate: new Date(order.requiredDate),
      deliveryLocation: order.deliveryLocation.trim(),
      remarks: toOptionalText(order.remarks),
      supplierId: order.supplierId.trim(),
    }));

    const newOrderCount = incoming.filter(
      (order) => !(order.id && existingIds.has(order.id))
    ).length;
    const allocatedNumbers = await allocatePoNumbers(newOrderCount);
    let nextAllocated = 0;
    const incomingIds = new Set(
      incoming.flatMap((order) =>
        order.id && existingIds.has(order.id) ? [order.id] : []
      )
    );
    const deleteIds = project.purchaseOrders
      .filter((order) => !incomingIds.has(order.id))
      .map((order) => order.id);

    const created: string[] = [];
    const updated: string[] = [];
    const savedOrders: PurchaseOrderLineValues[] = [];

    await prisma.$transaction(async (tx) => {
      if (deleteIds.length > 0) {
        await tx.purchaseOrder.deleteMany({
          where: { id: { in: deleteIds }, projectId },
        });
      }

      for (const order of incoming) {
        const data = {
          item: order.item,
          description: order.description,
          specification: order.specification,
          qty: order.qty,
          unit: order.unit,
          unitPrice: order.unitPrice,
          total: lineTotal(order.qty, order.unitPrice),
          requiredDate: order.requiredDate,
          deliveryLocation: order.deliveryLocation,
          remarks: order.remarks,
          supplierId: order.supplierId,
        };

        const record =
          order.id && existingIds.has(order.id)
            ? await tx.purchaseOrder.update({
                where: { id: order.id },
                data,
              })
            : await tx.purchaseOrder.create({
                data: {
                  projectId,
                  poNumber:
                    order.poNumber ?? allocatedNumbers[nextAllocated++] ?? "",
                  ...data,
                },
              });

        if (order.id && existingIds.has(order.id)) {
          updated.push(record.poNumber);
        } else {
          created.push(record.poNumber);
        }

        savedOrders.push(serializeOrder(record));
      }
    });

    const hadExisting = project.purchaseOrders.length > 0;
    await writeAuditLog({
      userId,
      action: hadExisting ? "UPDATE" : "CREATE",
      entity: "PurchaseOrder",
      entityId: projectId,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        created,
        updated,
        deleted: deleteIds.length,
        orderCount: incoming.length,
      },
    });

    revalidateWorkspace();
    return {
      success: true as const,
      orders: savedOrders,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save purchase orders.";
    return { error: message };
  }
}

export async function savePurchaseOrder(
  projectId: string,
  raw: PurchaseOrderLineValues
) {
  const parsed = purchaseOrderLineSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid purchase order data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const qty = Number(parsed.data.qty);
    const unitPrice = Number(parsed.data.unitPrice);
    const data = {
      item: parsed.data.item.trim(),
      description: parsed.data.description.trim(),
      specification: parsed.data.specification.trim(),
      qty,
      unit: parsed.data.unit.trim(),
      unitPrice,
      total: lineTotal(qty, unitPrice),
      requiredDate: new Date(parsed.data.requiredDate),
      deliveryLocation: parsed.data.deliveryLocation.trim(),
      remarks: toOptionalText(parsed.data.remarks),
      supplierId: parsed.data.supplierId.trim(),
    };

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.purchaseOrder.findFirst({
          where: { id: existingId, projectId },
          select: { id: true, poNumber: true },
        })
      : null;

    const record = existing
      ? await prisma.purchaseOrder.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.purchaseOrder.create({
          data: {
            projectId,
            poNumber: (await allocatePoNumbers(1))[0] ?? "",
            ...data,
          },
        });

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "PurchaseOrder",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        poNumber: record.poNumber,
        item: record.item,
      },
    });

    revalidateWorkspace();
    return { success: true as const, order: serializeOrder(record) };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save purchase order.";
    return { error: message };
  }
}

export async function deletePurchaseOrder(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        poNumber: true,
        item: true,
        project: { select: { projectNumber: true } },
      },
    });

    if (!existing) {
      return { error: "Purchase order not found." };
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "PurchaseOrder",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        poNumber: existing.poNumber,
        item: existing.item,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete purchase order.";
    return { error: message };
  }
}

export async function createReceivingNote(
  projectId: string,
  raw: ReceivingNoteValues
) {
  const parsed = receivingNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid receiving note.",
    };
  }

  try {
    const userId = await requireUserId();
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: parsed.data.purchaseOrderId, projectId },
      select: {
        id: true,
        poNumber: true,
        item: true,
        project: { select: { id: true, projectNumber: true } },
      },
    });

    if (!purchaseOrder) {
      return { error: "Purchase order not found." };
    }

    const note = await prisma.receivingNote.create({
      data: {
        purchaseOrderId: purchaseOrder.id,
        receivedQty: Number(parsed.data.receivedQty),
        condition: parsed.data.condition,
        shortageDamage: parsed.data.shortageDamage.trim(),
        checkedBy: parsed.data.checkedBy.trim(),
        date: new Date(parsed.data.date),
      },
    });

    await applyStockDelta({
      userId,
      match: purchaseOrder.item,
      delta: note.receivedQty,
      reason: "Material receiving note",
      entity: "ReceivingNote",
      entityId: note.id,
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "ReceivingNote",
      entityId: note.id,
      details: {
        projectId,
        projectNumber: purchaseOrder.project.projectNumber,
        poNumber: purchaseOrder.poNumber,
        receivedQty: note.receivedQty,
        condition: note.condition,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: note.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save receiving note.";
    return { error: message };
  }
}
