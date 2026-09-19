"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validations/client";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage clients.");
  }
  return session.user.id;
}

async function nextLeadNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `WS-L-${year}-`;
  const latest = await prisma.client.findFirst({
    where: { leadNumber: { startsWith: prefix } },
    orderBy: { leadNumber: "desc" },
    select: { leadNumber: true },
  });

  const sequence = latest
    ? Number(latest.leadNumber.slice(prefix.length)) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export async function createClient(raw: ClientFormValues) {
  const parsed = clientFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  try {
    const userId = await requireUserId();
    const leadNumber = await nextLeadNumber();
    const data = {
      ...parsed.data,
      contactPerson: parsed.data.contactPerson || null,
      email: parsed.data.email.toLowerCase(),
    };

    const client = await prisma.client.create({
      data: {
        ...data,
        leadNumber,
      },
    });

    await writeAuditLog({
      userId,
      action: "CREATE",
      entity: "Client",
      entityId: client.id,
      details: {
        leadNumber: client.leadNumber,
        name: client.name,
        status: client.status,
        source: client.source,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: client.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create client.";
    return { error: message };
  }
}

export async function updateClient(id: string, raw: ClientFormValues) {
  const parsed = clientFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  try {
    const userId = await requireUserId();
    const existing = await prisma.client.findUnique({
      where: { id },
      select: { id: true, leadNumber: true },
    });

    if (!existing) {
      return { error: "Client not found." };
    }

    const data = {
      ...parsed.data,
      contactPerson: parsed.data.contactPerson || null,
      email: parsed.data.email.toLowerCase(),
    };

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "Client",
      entityId: client.id,
      details: {
        leadNumber: client.leadNumber,
        name: client.name,
        status: client.status,
        source: client.source,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: client.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update client.";
    return { error: message };
  }
}

export async function deleteClient(id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        leadNumber: true,
        name: true,
        _count: { select: { projects: true } },
      },
    });

    if (!existing) {
      return { error: "Client not found." };
    }

    if (existing._count.projects > 0) {
      return {
        error:
          "This client still has projects. Reassign or delete those jobs first.",
      };
    }

    await prisma.client.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "Client",
      entityId: id,
      details: {
        leadNumber: existing.leadNumber,
        name: existing.name,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete client.";
    return { error: message };
  }
}
