"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  emptyPipelineValues,
  isPipelineStep,
  type PipelineStep,
} from "@/lib/validations/pipeline";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage the work order.");
  }
  return session.user.id;
}

export async function ensureWorkOrderPipeline(projectId: string) {
  const existing = await prisma.workOrderPipeline.findUnique({
    where: { projectId },
  });
  if (existing) {
    return existing;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return null;
  }

  return prisma.workOrderPipeline.create({
    data: { projectId, ...emptyPipelineValues },
  });
}

export async function togglePipelineStep(
  projectId: string,
  step: PipelineStep,
  complete: boolean
) {
  if (!isPipelineStep(step)) {
    return { error: "Unknown work-order step." };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        workOrderPipeline: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const data = { [step]: complete };
    const record = project.workOrderPipeline
      ? await prisma.workOrderPipeline.update({
          where: { projectId },
          data,
        })
      : await prisma.workOrderPipeline.create({
          data: { projectId, ...emptyPipelineValues, ...data },
        });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "WorkOrderPipeline",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        step,
        complete,
      },
    });

    revalidateWorkspace();
    return { success: true as const, step, complete };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the work order.";
    return { error: message };
  }
}
