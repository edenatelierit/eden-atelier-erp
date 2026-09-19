"use server";

import { auth } from "@/auth";
import { applyStockDelta } from "@/actions/inventory";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  cuttingListPartSchema,
  cuttingListSchema,
  type CuttingListPartValues,
  type CuttingListValues,
} from "@/lib/validations/production";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage production.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveCuttingList(
  projectId: string,
  raw: CuttingListValues
) {
  const parsed = cuttingListSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid cutting list.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        cuttingListParts: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const incoming = parsed.data.parts.map((part) => ({
      id: part.id?.trim() || undefined,
      partNumber: part.partNumber.trim(),
      description: part.description.trim(),
      qty: Number(part.qty),
      length: Number(part.length),
      width: Number(part.width),
      thickness: Number(part.thickness),
      material: part.material.trim(),
      edge1: toOptionalText(part.edge1),
      edge2: toOptionalText(part.edge2),
      notes: toOptionalText(part.notes),
    }));

    const existingIds = new Set(project.cuttingListParts.map((part) => part.id));
    const incomingIds = new Set(
      incoming.flatMap((part) => (part.id && existingIds.has(part.id) ? [part.id] : []))
    );
    const deleteIds = project.cuttingListParts
      .filter((part) => !incomingIds.has(part.id))
      .map((part) => part.id);

    const created: string[] = [];
    const updated: string[] = [];
    const savedParts: {
      id: string;
      partNumber: string;
      description: string;
      qty: string;
      length: string;
      width: string;
      thickness: string;
      material: string;
      edge1: string;
      edge2: string;
      notes: string;
    }[] = [];

    await prisma.$transaction(async (tx) => {
      if (deleteIds.length > 0) {
        await tx.cuttingListPart.deleteMany({
          where: { id: { in: deleteIds }, projectId },
        });
      }

      for (const part of incoming) {
        const data = {
          partNumber: part.partNumber,
          description: part.description,
          qty: part.qty,
          length: part.length,
          width: part.width,
          thickness: part.thickness,
          material: part.material,
          edge1: part.edge1,
          edge2: part.edge2,
          notes: part.notes,
        };

        const record =
          part.id && existingIds.has(part.id)
            ? await tx.cuttingListPart.update({
                where: { id: part.id },
                data,
              })
            : await tx.cuttingListPart.create({
                data: { projectId, ...data },
              });

        if (part.id && existingIds.has(part.id)) {
          updated.push(part.partNumber);
        } else {
          created.push(record.partNumber);
        }

        savedParts.push({
          id: record.id,
          partNumber: record.partNumber,
          description: record.description,
          qty: String(record.qty),
          length: String(record.length),
          width: String(record.width),
          thickness: String(record.thickness),
          material: record.material,
          edge1: record.edge1 ?? "",
          edge2: record.edge2 ?? "",
          notes: record.notes ?? "",
        });
      }
    });

    const hadExisting = project.cuttingListParts.length > 0;
    await writeAuditLog({
      userId,
      action: hadExisting ? "UPDATE" : "CREATE",
      entity: "CuttingList",
      entityId: projectId,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        created,
        updated,
        deleted: deleteIds.length,
        partCount: incoming.length,
      },
    });

    revalidateWorkspace();
    return {
      success: true as const,
      created: created.length,
      updated: updated.length,
      parts: savedParts,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save cutting list.";
    return { error: message };
  }
}

function serializePart(part: {
  id: string;
  partNumber: string;
  description: string;
  qty: number;
  length: number;
  width: number;
  thickness: number;
  material: string;
  edge1: string | null;
  edge2: string | null;
  notes: string | null;
}): CuttingListPartValues {
  return {
    id: part.id,
    partNumber: part.partNumber,
    description: part.description,
    qty: String(part.qty),
    length: String(part.length),
    width: String(part.width),
    thickness: String(part.thickness),
    material: part.material,
    edge1: part.edge1 ?? "",
    edge2: part.edge2 ?? "",
    notes: part.notes ?? "",
  };
}

export async function saveCuttingListPart(
  projectId: string,
  raw: CuttingListPartValues
) {
  const parsed = cuttingListPartSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid cutting list part.",
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

    const data = {
      partNumber: parsed.data.partNumber.trim(),
      description: parsed.data.description.trim(),
      qty: Number(parsed.data.qty),
      length: Number(parsed.data.length),
      width: Number(parsed.data.width),
      thickness: Number(parsed.data.thickness),
      material: parsed.data.material.trim(),
      edge1: toOptionalText(parsed.data.edge1),
      edge2: toOptionalText(parsed.data.edge2),
      notes: toOptionalText(parsed.data.notes),
    };

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.cuttingListPart.findFirst({
          where: { id: existingId, projectId },
          select: { id: true, qty: true, material: true },
        })
      : null;

    const record = existing
      ? await prisma.cuttingListPart.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.cuttingListPart.create({
          data: { projectId, ...data },
        });

    if (existing) {
      if (existing.material !== record.material) {
        await applyStockDelta({
          userId,
          match: existing.material,
          delta: existing.qty,
          reason: "Cutting list material changed",
          entity: "CuttingListPart",
          entityId: record.id,
        });
        await applyStockDelta({
          userId,
          match: record.material,
          delta: -record.qty,
          reason: "Cutting list issued",
          entity: "CuttingListPart",
          entityId: record.id,
        });
      } else if (existing.qty !== record.qty) {
        await applyStockDelta({
          userId,
          match: record.material,
          delta: existing.qty - record.qty,
          reason: "Cutting list quantity updated",
          entity: "CuttingListPart",
          entityId: record.id,
        });
      }
    } else {
      await applyStockDelta({
        userId,
        match: record.material,
        delta: -record.qty,
        reason: "Cutting list issued",
        entity: "CuttingListPart",
        entityId: record.id,
      });
    }

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "CuttingListPart",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        partNumber: record.partNumber,
      },
    });

    revalidateWorkspace();
    return { success: true as const, part: serializePart(record) };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save cutting list part.";
    return { error: message };
  }
}

export async function deleteCuttingListPart(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.cuttingListPart.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        partNumber: true,
        qty: true,
        material: true,
        project: { select: { projectNumber: true } },
      },
    });

    if (!existing) {
      return { error: "Cutting list part not found." };
    }

    await prisma.cuttingListPart.delete({ where: { id } });
    await applyStockDelta({
      userId,
      match: existing.material,
      delta: existing.qty,
      reason: "Cutting list part removed",
      entity: "CuttingListPart",
      entityId: id,
    });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "CuttingListPart",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        partNumber: existing.partNumber,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete cutting list part.";
    return { error: message };
  }
}
