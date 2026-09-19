"use server";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  installationReportSchema,
  type InstallationReportValues,
} from "@/lib/validations/installation";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage installation reports.");
  }
  return session.user.id;
}

function toText(value?: string) {
  return value?.trim() ?? "";
}

export async function saveInstallationReport(
  projectId: string,
  raw: InstallationReportValues
) {
  const parsed = installationReportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid installation report.",
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
      reportDate: new Date(`${parsed.data.reportDate}T00:00:00.000Z`),
      supervisor: parsed.data.supervisor.trim(),
      teamOnSite: parsed.data.teamOnSite.trim(),
      workCompleted: parsed.data.workCompleted.trim(),
      workRemaining: toText(parsed.data.workRemaining),
      issuesDelays: toText(parsed.data.issuesDelays),
      materialsRequired: toText(parsed.data.materialsRequired),
      nextPlannedWork: toText(parsed.data.nextPlannedWork),
      siteReady: parsed.data.siteReady,
      materialsAvailable: parsed.data.materialsAvailable,
      workAreaAccessible: parsed.data.workAreaAccessible,
      photosTaken: parsed.data.photosTaken,
      photoUrls: parsed.data.photoUrls as Prisma.InputJsonValue,
    };

    const existingId = parsed.data.id?.trim();
    const report = existingId
      ? await prisma.installationReport.update({
          where: { id: existingId },
          data,
        })
      : await prisma.installationReport.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "InstallationReport",
      entityId: report.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        reportDate: parsed.data.reportDate,
        supervisor: data.supervisor,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: report.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save installation report.";
    return { error: message };
  }
}

export async function deleteInstallationReport(projectId: string, id: string) {
  try {
    const userId = await requireUserId();
    const report = await prisma.installationReport.findFirst({
      where: { id, projectId },
      select: { id: true },
    });

    if (!report) {
      return { error: "Installation report not found." };
    }

    await prisma.installationReport.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "InstallationReport",
      entityId: id,
      details: { projectId },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete installation report.";
    return { error: message };
  }
}
