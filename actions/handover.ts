"use server";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  handoverCertificateSchema,
  serviceRequestSchema,
  type HandoverCertificateValues,
  type ServiceRequestValues,
} from "@/lib/validations/handover";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage handover and service.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toOptionalDate(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? new Date(trimmed) : null;
}

export async function saveHandoverCertificate(
  projectId: string,
  raw: HandoverCertificateValues
) {
  const parsed = handoverCertificateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid handover data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        handoverCertificate: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const data = {
      handoverDate: new Date(parsed.data.handoverDate),
      woodJoinery: parsed.data.woodJoinery,
      kitchen: parsed.data.kitchen,
      wardrobes: parsed.data.wardrobes,
      stoneWorks: parsed.data.stoneWorks,
      countertops: parsed.data.countertops,
      careInstructions: parsed.data.careInstructions,
      warrantyProvided: parsed.data.warrantyProvided,
      finalDrawings: parsed.data.finalDrawings,
      outstandingItems: toOptionalText(parsed.data.outstandingItems),
      remarks: toOptionalText(parsed.data.remarks),
      photoUrls: parsed.data.photoUrls as Prisma.InputJsonValue,
    };

    const record = project.handoverCertificate
      ? await prisma.handoverCertificate.update({
          where: { projectId },
          data,
        })
      : await prisma.handoverCertificate.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: project.handoverCertificate ? "UPDATE" : "CREATE",
      entity: "HandoverCertificate",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        handoverDate: parsed.data.handoverDate,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save handover certificate.";
    return { error: message };
  }
}

export async function saveServiceRequest(
  projectId: string,
  raw: ServiceRequestValues
) {
  const parsed = serviceRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid service request.",
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
      dateReported: new Date(parsed.data.dateReported),
      issue: parsed.data.issue.trim(),
      warrantyStatus: parsed.data.warrantyStatus,
      technician: parsed.data.technician.trim(),
      visitDate: toOptionalDate(parsed.data.visitDate),
      diagnosis: toOptionalText(parsed.data.diagnosis),
      status: parsed.data.status,
    };

    const existingId = parsed.data.id?.trim();
    const existing = existingId
      ? await prisma.serviceRequest.findFirst({
          where: { id: existingId, projectId },
          select: { id: true },
        })
      : null;

    const record = existing
      ? await prisma.serviceRequest.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.serviceRequest.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: existing ? "UPDATE" : "CREATE",
      entity: "ServiceRequest",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        status: record.status,
        warrantyStatus: record.warrantyStatus,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save service request.";
    return { error: message };
  }
}

export async function deleteServiceRequest(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.serviceRequest.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        issue: true,
        project: { select: { projectNumber: true } },
      },
    });

    if (!existing) {
      return { error: "Service request not found." };
    }

    await prisma.serviceRequest.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "ServiceRequest",
      entityId: id,
      details: {
        projectId,
        projectNumber: existing.project.projectNumber,
        issue: existing.issue,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete service request.";
    return { error: message };
  }
}
