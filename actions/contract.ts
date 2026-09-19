"use server";

import { auth } from "@/auth";
import { revalidateWorkspace } from "@/lib/revalidate";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  contractFormSchema,
  type ContractFormValues,
} from "@/lib/validations/contract";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage contracts.");
  }
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveContract(projectId: string, raw: ContractFormValues) {
  const parsed = contractFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid contract data.",
    };
  }

  try {
    const userId = await requireUserId();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true, contract: { select: { id: true } } },
    });

    if (!project) {
      return { error: "Project not found." };
    }

    const contractValue = parsed.data.contractValue
      ? Number(parsed.data.contractValue)
      : null;

    const data = {
      contractValue,
      projectDuration: toOptionalText(parsed.data.projectDuration),
      warrantyPeriod: toOptionalText(parsed.data.warrantyPeriod),
      specialConditions: toOptionalText(parsed.data.specialConditions),
      scopeOfWorkAttached: parsed.data.scopeOfWorkAttached,
      paymentTermsAgreed: parsed.data.paymentTermsAgreed,
      shopDrawingApprovalRequired: parsed.data.shopDrawingApprovalRequired,
      materialApprovalRequired: parsed.data.materialApprovalRequired,
      siteReadinessDefined: parsed.data.siteReadinessDefined,
      variationsRequireWrittenApproval:
        parsed.data.variationsRequireWrittenApproval,
      delayTermsIncluded: parsed.data.delayTermsIncluded,
      warrantyTermsIncluded: parsed.data.warrantyTermsIncluded,
      cancellationTermsIncluded: parsed.data.cancellationTermsIncluded,
      governingLawReviewed: parsed.data.governingLawReviewed,
    };

    const contract = project.contract
      ? await prisma.contract.update({
          where: { projectId },
          data,
        })
      : await prisma.contract.create({
          data: { projectId, ...data },
        });

    await writeAuditLog({
      userId,
      action: "UPDATE",
      entity: "Contract",
      entityId: contract.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        created: !project.contract,
        contractValue,
        projectDuration: data.projectDuration,
        warrantyPeriod: data.warrantyPeriod,
        compliance: {
          scopeOfWorkAttached: data.scopeOfWorkAttached,
          paymentTermsAgreed: data.paymentTermsAgreed,
          shopDrawingApprovalRequired: data.shopDrawingApprovalRequired,
          materialApprovalRequired: data.materialApprovalRequired,
          siteReadinessDefined: data.siteReadinessDefined,
          variationsRequireWrittenApproval:
            data.variationsRequireWrittenApproval,
          delayTermsIncluded: data.delayTermsIncluded,
          warrantyTermsIncluded: data.warrantyTermsIncluded,
          cancellationTermsIncluded: data.cancellationTermsIncluded,
          governingLawReviewed: data.governingLawReviewed,
        },
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: contract.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save contract.";
    return { error: message };
  }
}
