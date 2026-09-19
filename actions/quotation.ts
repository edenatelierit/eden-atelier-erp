"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  quotationFormSchema,
  type QuotationFormValues,
} from "@/lib/validations/quotation";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage quotations.");
  }
  return session.user.id;
}

export async function saveQuotation(projectId: string, raw: QuotationFormValues) {
  const parsed = quotationFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid quotation data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        quotation: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const data = {
      scopeSummary: parsed.data.scopeSummary.trim(),
      subtotal: Number(parsed.data.subtotal),
      vat: Number(parsed.data.vat),
      total: Number(parsed.data.total),
      paymentTerms: parsed.data.paymentTerms.trim(),
      leadTimeWeeks: Number(parsed.data.leadTimeWeeks),
      validUntil: new Date(`${parsed.data.validUntil}T00:00:00.000Z`),
      status: parsed.data.status,
      kitchenScopeIncluded: parsed.data.kitchenScopeIncluded,
      stoneScopeIncluded: parsed.data.stoneScopeIncluded,
      exclusionsListed: parsed.data.exclusionsListed,
    };

    const quotation = project.quotation
      ? await prisma.quotation.update({
          where: { projectId },
          data,
        })
      : await prisma.quotation.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: project.quotation ? "UPDATE" : "CREATE",
      entity: "Quotation",
      entityId: quotation.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        status: data.status,
        total: data.total,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: quotation.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save quotation.";
    return { error: message };
  }
}
