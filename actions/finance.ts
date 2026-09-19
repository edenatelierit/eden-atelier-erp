"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import { roundUsd } from "@/lib/money";
import {
  paymentBalance,
  paymentStatus,
  splitContractAmounts,
  updatePaymentSchema,
  type UpdatePaymentValues,
} from "@/lib/validations/finance";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage payments.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toOptionalDate(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? new Date(`${trimmed}T00:00:00.000Z`) : null;
}

export async function ensurePaymentStages(projectId: string) {
  const existing = await prisma.paymentStage.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
  if (existing.length > 0) {
    return existing;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      contract: { select: { contractValue: true } },
      quotation: { select: { total: true } },
    },
  });

  if (!project) {
    return [];
  }

  const total =
    project.contract?.contractValue ?? project.quotation?.total ?? 0;
  const stages = splitContractAmounts(total);

  await prisma.paymentStage.createMany({
    data: stages.map((stage) => ({
      projectId,
      ...stage,
    })),
  });

  return prisma.paymentStage.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function updatePayment(
  projectId: string,
  raw: UpdatePaymentValues
) {
  const parsed = updatePaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment update.",
    };
  }

  try {
    const userId = await requireUserId();
    const stage = await prisma.paymentStage.findFirst({
      where: { id: parsed.data.id, projectId },
    });

    if (!stage) {
      return { error: "Payment stage not found." };
    }

    const amountPaid = Math.min(
      roundUsd(Number(parsed.data.amountPaid)),
      roundUsd(stage.amount)
    );
    const balance = paymentBalance(stage.amount, amountPaid);
    const status = paymentStatus(stage.amount, amountPaid);
    const paidDate =
      amountPaid > 0
        ? (toOptionalDate(parsed.data.paidDate) ?? new Date())
        : null;

    const record = await prisma.paymentStage.update({
      where: { id: stage.id },
      data: {
        amountPaid,
        balance,
        status,
        paidDate,
        invoiceRef: toOptionalText(parsed.data.invoiceRef),
        notes: toOptionalText(parsed.data.notes),
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectNumber: true },
    });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "PaymentStage",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project?.projectNumber,
        stageName: record.stageName,
        amountPaid: record.amountPaid,
        balance: record.balance,
        status: record.status,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update payment.";
    return { error: message };
  }
}
