"use server";

import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  drawingApprovalSchema,
  materialApprovalSchema,
  type DrawingApprovalValues,
  type MaterialApprovalValues,
} from "@/lib/validations/approval";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage approvals.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function requireProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectNumber: true },
  });

  if (!project) {
    return null;
  }

  return project;
}

export async function createMaterialApproval(
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

    const material = await prisma.materialApproval.create({
      data: {
        projectId,
        itemLocation: parsed.data.itemLocation.trim(),
        material: parsed.data.material.trim(),
        supplier: vendor.name,
        supplierId: vendor.id,
        productCode: parsed.data.productCode.trim(),
        thickness: parsed.data.thickness.trim(),
        finish: parsed.data.finish.trim(),
        sampleAttached: parsed.data.sampleAttached,
        status: parsed.data.status,
        comments: toOptionalText(parsed.data.comments),
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
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
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save material approval.";
    return { error: message };
  }
}

export async function createDrawingApproval(
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

    const drawing = await prisma.drawingApproval.create({
      data: {
        projectId,
        drawingNo: parsed.data.drawingNo.trim(),
        title: parsed.data.title.trim(),
        revision: parsed.data.revision.trim(),
        status: parsed.data.status,
        comments: toOptionalText(parsed.data.comments),
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "DrawingApproval",
      entityId: drawing.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        drawingNo: drawing.drawingNo,
        title: drawing.title,
        revision: drawing.revision,
        status: drawing.status,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: drawing.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save drawing approval.";
    return { error: message };
  }
}
