"use server";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  surveyFormSchema,
  type SurveyFormValues,
} from "@/lib/validations/survey";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage site surveys.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveSiteSurvey(projectId: string, raw: SurveyFormValues) {
  const parsed = surveyFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid survey data." };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true, siteSurvey: { select: { id: true } } },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const data = {
      electrical: parsed.data.electrical,
      plumbing: parsed.data.plumbing,
      drainage: parsed.data.drainage,
      gas: parsed.data.gas,
      ac: parsed.data.ac,
      lighting: parsed.data.lighting,
      elevator: parsed.data.elevator,
      loadingAccess: parsed.data.loadingAccess,
      craneRequired: parsed.data.craneRequired,
      restrictions: toOptionalText(parsed.data.restrictions),
      observations: toOptionalText(parsed.data.observations),
      photoReferences: toOptionalText(parsed.data.photoReferences),
      photoUrls: parsed.data.photoUrls as Prisma.InputJsonValue,
    };

    const survey = project.siteSurvey
      ? await prisma.siteSurvey.update({
          where: { projectId },
          data,
        })
      : await prisma.siteSurvey.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "SiteSurvey",
      entityId: survey.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        created: !project.siteSurvey,
        infrastructure: {
          electrical: data.electrical,
          plumbing: data.plumbing,
          drainage: data.drainage,
          gas: data.gas,
          ac: data.ac,
          lighting: data.lighting,
        },
        access: {
          elevator: data.elevator,
          loadingAccess: data.loadingAccess,
          craneRequired: data.craneRequired,
        },
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: survey.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save site survey.";
    return { error: message };
  }
}
