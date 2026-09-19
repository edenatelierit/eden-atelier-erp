"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  revisedContractValue,
  variationOrderSchema,
  variationStatusSchema,
  type VariationOrderValues,
  type VariationStatusValues,
} from "@/lib/validations/variation";

async function requireVariationUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage variation orders.");
  }
  assertRole(session.user.role, ["SALES", "ACCOUNTANT"]);
  return session.user.id;
}

async function nextVoNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `VO-${year}-`;
  const latest = await prisma.variationOrder.findFirst({
    where: { voNumber: { startsWith: prefix } },
    orderBy: { voNumber: "desc" },
    select: { voNumber: true },
  });
  const sequence = latest
    ? Number(latest.voNumber.slice(prefix.length)) + 1
    : 1;
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export async function createVariationOrder(
  projectId: string,
  raw: VariationOrderValues
) {
  const parsed = variationOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid variation order.",
    };
  }

  try {
    const userId = await requireVariationUser();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true },
    });
    if (!project) {
      return { error: "Project not found." };
    }

    const original = Number(parsed.data.originalContractValue);
    const impact = Number(parsed.data.costImpact);
    const revised = Number(revisedContractValue(String(original), String(impact)));

    const record = await prisma.variationOrder.create({
      data: {
        projectId,
        voNumber: await nextVoNumber(),
        date: new Date(`${parsed.data.date}T00:00:00.000Z`),
        requestedBy: parsed.data.requestedBy.trim(),
        originalContractValue: original,
        scopeVariation: parsed.data.scopeVariation.trim(),
        reason: parsed.data.reason.trim(),
        costImpact: impact,
        timeImpactDays: Number(parsed.data.timeImpactDays),
        revisedContractValue: revised,
        status: "PENDING",
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "VariationOrder",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        voNumber: record.voNumber,
        costImpact: record.costImpact,
        revisedContractValue: record.revisedContractValue,
        status: record.status,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save variation order.";
    return { error: message };
  }
}

export async function updateVariationStatus(
  projectId: string,
  raw: VariationStatusValues
) {
  const parsed = variationStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid variation status.",
    };
  }

  try {
    const userId = await requireVariationUser();
    const existing = await prisma.variationOrder.findFirst({
      where: { id: parsed.data.id, projectId },
      include: { project: { select: { projectNumber: true } } },
    });

    if (!existing) {
      return { error: "Variation order not found." };
    }
    if (existing.status !== "PENDING") {
      return { error: "Only pending variation orders can be decided." };
    }

    const record = await prisma.variationOrder.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "VariationOrder",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        voNumber: record.voNumber,
        status: record.status,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update variation order.";
    return { error: message };
  }
}
