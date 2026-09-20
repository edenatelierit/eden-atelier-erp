"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  drawingApprovalSchema,
  materialApprovalSchema,
  type DrawingApprovalValues,
  type MaterialApprovalValues,
} from "@/lib/validations/approval";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage engineering approvals.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function requireProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectNumber: true },
  });
}

export async function saveMaterialApproval(
  projectId: string,
  raw: MaterialApprovalValues
) {
  const parsed = materialApprovalSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid material data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await requireProject(projectId);
    if (!project) {
      return { error: "Project not found." };
    }

    const vendor = await prisma.supplier.findUnique({
      where: { id: parsed.data.supplierId },
      select: { id: true, name: true },
    });
    if (!vendor) {
      return { error: "Selected supplier was not found." };
    }

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.materialApproval.findFirst({
          where: { id: existingId, projectId },
          select: { id: true },
        })
      : null;

    const data = {
      itemLocation: parsed.data.itemLocation.trim(),
      material: parsed.data.material.trim(),
      supplier: vendor.name,
      supplierId: vendor.id,
      productCode: parsed.data.productCode.trim(),
      thickness: parsed.data.thickness?.trim() ?? "",
      finish: parsed.data.finish?.trim() ?? "",
      sampleAttached: parsed.data.hasPhysicalSample,
      hasPhysicalSample: parsed.data.hasPhysicalSample,
      hasPhotograph: parsed.data.hasPhotograph,
      hasTechnicalData: parsed.data.hasTechnicalData,
      status: parsed.data.status,
      comments: toOptionalText(parsed.data.comments),
    };

    const material = existing
      ? await prisma.materialApproval.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.materialApproval.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "MaterialApproval",
      entityId: material.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        itemLocation: material.itemLocation,
        material: material.material,
        status: material.status,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: material.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Apply the latest database schema to save approvals." };
    }
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save material approval.";
    return { error: message };
  }
}

export async function deleteMaterialApproval(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.materialApproval.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        material: true,
        itemLocation: true,
        project: { select: { projectNumber: true } },
      },
    });
    if (!existing) {
      return { error: "Material approval not found." };
    }

    await prisma.materialApproval.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "MaterialApproval",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        material: existing.material,
        itemLocation: existing.itemLocation,
      },
    });
    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete material approval.";
    return { error: message };
  }
}

export async function saveDrawingApproval(
  projectId: string,
  raw: DrawingApprovalValues
) {
  const parsed = drawingApprovalSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid drawing data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await requireProject(projectId);
    if (!project) {
      return { error: "Project not found." };
    }

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.drawingApproval.findFirst({
          where: { id: existingId, projectId },
          select: { id: true, status: true, fileUrl: true },
        })
      : null;

    const data = {
      drawingNumber: parsed.data.drawingNumber.trim(),
      title: parsed.data.title.trim(),
      revision: parsed.data.revision.trim(),
      fileUrl: toOptionalText(parsed.data.fileUrl),
      status: parsed.data.status,
      comments: toOptionalText(parsed.data.comments),
    };

    const drawing = existing
      ? await prisma.drawingApproval.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.drawingApproval.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "DrawingApproval",
      entityId: drawing.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        drawingNumber: drawing.drawingNumber,
        title: drawing.title,
        revision: drawing.revision,
        status: drawing.status,
        previousStatus: existing?.status,
        fileUrl: drawing.fileUrl,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: drawing.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Apply the latest database schema to save drawings." };
    }
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save drawing approval.";
    return { error: message };
  }
}

export async function deleteDrawingApproval(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.drawingApproval.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        drawingNumber: true,
        title: true,
        project: { select: { projectNumber: true } },
      },
    });
    if (!existing) {
      return { error: "Drawing approval not found." };
    }

    await prisma.drawingApproval.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "DrawingApproval",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        drawingNumber: existing.drawingNumber,
        title: existing.title,
      },
    });
    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete drawing approval.";
    return { error: message };
  }
}
