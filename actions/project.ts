"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/validations/project";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage projects.");
  }
  return session.user.id;
}

async function nextProjectNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `WS-${year}-`;
  const latest = await prisma.project.findFirst({
    where: { projectNumber: { startsWith: prefix } },
    orderBy: { projectNumber: "desc" },
    select: { projectNumber: true },
  });

  const sequence = latest
    ? Number(latest.projectNumber.slice(prefix.length)) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createProject(raw: ProjectFormValues) {
  const parsed = projectFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data." };
  }

  try {
    const userId = await requireUserId();
    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: { id: true, name: true },
    });

    if (!client) {
      return { error: "Selected client was not found." };
    }

    const projectNumber = await nextProjectNumber();
    const budget = parsed.data.targetBudget
      ? new Prisma.Decimal(parsed.data.targetBudget)
      : null;
    const targetCompletionDate = parsed.data.targetCompletionDate
      ? new Date(parsed.data.targetCompletionDate)
      : null;

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        projectNumber,
        location: parsed.data.location.trim(),
        targetBudget: budget,
        targetCompletionDate,
        preferredStyle: toOptionalText(parsed.data.preferredStyle),
        preferredWood: toOptionalText(parsed.data.preferredWood),
        preferredStone: toOptionalText(parsed.data.preferredStone),
        preferredColors: toOptionalText(parsed.data.preferredColors),
        preferredHardware: toOptionalText(parsed.data.preferredHardware),
        areasIncluded: parsed.data.areasIncluded,
        status: "LEAD",
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "Project",
      entityId: project.id,
      details: {
        projectNumber: project.projectNumber,
        clientId: client.id,
        clientName: client.name,
        location: project.location,
        status: project.status,
        areasIncluded: parsed.data.areasIncluded,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: project.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create project.";
    return { error: message };
  }
}

export async function updateProject(id: string, raw: ProjectFormValues) {
  const parsed = projectFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data." };
  }

  try {
    const userId = await requireUserId();
    const existing = await prisma.project.findUnique({
      where: { id },
      select: { id: true, projectNumber: true },
    });

    if (!existing) {
      return { error: "Project not found." };
    }

    const client = await prisma.client.findUnique({
      where: { id: parsed.data.clientId },
      select: { id: true, name: true },
    });

    if (!client) {
      return { error: "Selected client was not found." };
    }

    const budget = parsed.data.targetBudget
      ? new Prisma.Decimal(parsed.data.targetBudget)
      : null;
    const targetCompletionDate = parsed.data.targetCompletionDate
      ? new Date(parsed.data.targetCompletionDate)
      : null;

    const project = await prisma.project.update({
      where: { id },
      data: {
        clientId: client.id,
        location: parsed.data.location.trim(),
        targetBudget: budget,
        targetCompletionDate,
        preferredStyle: toOptionalText(parsed.data.preferredStyle),
        preferredWood: toOptionalText(parsed.data.preferredWood),
        preferredStone: toOptionalText(parsed.data.preferredStone),
        preferredColors: toOptionalText(parsed.data.preferredColors),
        preferredHardware: toOptionalText(parsed.data.preferredHardware),
        areasIncluded: parsed.data.areasIncluded,
      },
    });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "Project",
      entityId: project.id,
      details: {
        projectNumber: project.projectNumber,
        clientId: client.id,
        clientName: client.name,
        location: project.location,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: project.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update project.";
    return { error: message };
  }
}

export async function deleteProject(id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        projectNumber: true,
        location: true,
        client: { select: { name: true } },
      },
    });

    if (!existing) {
      return { error: "Project not found." };
    }

    await prisma.project.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "Project",
      entityId: id,
      details: {
        projectNumber: existing.projectNumber,
        clientName: existing.client.name,
        location: existing.location,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete project.";
    return { error: message };
  }
}
