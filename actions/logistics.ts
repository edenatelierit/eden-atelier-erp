"use server";

import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  deliveryNoteSchema,
  qualityControlSchema,
  type DeliveryNoteValues,
  type QualityControlValues,
} from "@/lib/validations/logistics";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage logistics.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveQualityControl(
  projectId: string,
  raw: QualityControlValues
) {
  const parsed = qualityControlSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid quality control data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        qualityControl: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const data = {
      inspector: parsed.data.inspector.trim(),
      workOrder: parsed.data.workOrder.trim(),
      unitArea: parsed.data.unitArea.trim(),
      dimensionsMatch: parsed.data.dimensionsMatch,
      correctMaterial: parsed.data.correctMaterial,
      correctFinishColor: parsed.data.correctFinishColor,
      grainVeinDirectionCorrect: parsed.data.grainVeinDirectionCorrect,
      edgesProperlyFinished: parsed.data.edgesProperlyFinished,
      jointsClean: parsed.data.jointsClean,
      hardwareCorrect: parsed.data.hardwareCorrect,
      doorsDrawersAligned: parsed.data.doorsDrawersAligned,
      noScratchesDamage: parsed.data.noScratchesDamage,
      stoneCutoutsCorrect: parsed.data.stoneCutoutsCorrect,
      stoneEdgeProfileAcceptable: parsed.data.stoneEdgeProfileAcceptable,
    };

    const record = project.qualityControl
      ? await prisma.qualityControl.update({
          where: { projectId },
          data,
        })
      : await prisma.qualityControl.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: project.qualityControl ? "UPDATE" : "CREATE",
      entity: "QualityControl",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        inspector: data.inspector,
        workOrder: data.workOrder,
        unitArea: data.unitArea,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save quality control.";
    return { error: message };
  }
}

export async function createDeliveryNote(
  projectId: string,
  raw: DeliveryNoteValues
) {
  const parsed = deliveryNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid delivery note.",
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

    const note = await prisma.deliveryNote.create({
      data: {
        projectId,
        deliveryDateTime: new Date(parsed.data.deliveryDateTime),
        vehicleDriver: parsed.data.vehicleDriver.trim(),
        itemsDelivered: parsed.data.itemsDelivered.trim(),
        quantity: Number(parsed.data.quantity),
        conditionRemarks: toOptionalText(parsed.data.conditionRemarks),
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "DeliveryNote",
      entityId: note.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        vehicleDriver: note.vehicleDriver,
        quantity: note.quantity,
        itemsDelivered: note.itemsDelivered,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: note.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save delivery note.";
    return { error: message };
  }
}
