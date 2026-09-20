"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  boqItemSchema,
  boqLineTotal,
  type BoqItemValues,
} from "@/lib/validations/boq";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage the BOQ.");
  }
  return session.user.id;
}

export async function saveBoqItem(projectId: string, raw: BoqItemValues) {
  const parsed = boqItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid BOQ item.",
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

    const unit = await prisma.unitOfMeasure.findUnique({
      where: { id: parsed.data.unitId },
      select: { id: true, symbol: true },
    });
    if (!unit) {
      return { error: "Selected unit was not found." };
    }

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.boqItem.findFirst({
          where: { id: existingId, projectId },
          select: {
            id: true,
            totalCost: true,
            sellingPrice: true,
            quantity: true,
            materialCost: true,
            laborCost: true,
            otherCost: true,
          },
        })
      : null;

    const quantity = Number(parsed.data.quantity);
    const materialCost = roundMoney(Number(parsed.data.materialCost));
    const laborCost = roundMoney(Number(parsed.data.laborCost));
    const otherCost = roundMoney(Number(parsed.data.otherCost));
    const sellingPrice = roundMoney(Number(parsed.data.sellingPrice));
    const totalCost = roundMoney(
      boqLineTotal({ quantity, materialCost, laborCost, otherCost })
    );

    const data = {
      itemCode: parsed.data.itemCode.trim().toUpperCase(),
      description: parsed.data.description.trim(),
      material: parsed.data.material.trim(),
      unitId: unit.id,
      quantity,
      materialCost,
      laborCost,
      otherCost,
      totalCost,
      sellingPrice,
    };

    const record = existing
      ? await prisma.boqItem.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.boqItem.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "BoqItem",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        itemCode: record.itemCode,
        quantity: record.quantity,
        materialCost: record.materialCost,
        laborCost: record.laborCost,
        otherCost: record.otherCost,
        totalCost: record.totalCost,
        sellingPrice: record.sellingPrice,
        previousTotalCost: existing?.totalCost,
        previousSellingPrice: existing?.sellingPrice,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Apply the latest database schema to save BOQ items." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save BOQ item.";
    return { error: message };
  }
}

export async function deleteBoqItem(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.boqItem.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        itemCode: true,
        totalCost: true,
        sellingPrice: true,
        project: { select: { projectNumber: true } },
      },
    });
    if (!existing) {
      return { error: "BOQ item not found." };
    }

    await prisma.boqItem.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "BoqItem",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        itemCode: existing.itemCode,
        totalCost: existing.totalCost,
        sellingPrice: existing.sellingPrice,
      },
    });
    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete BOQ item.";
    return { error: message };
  }
}
