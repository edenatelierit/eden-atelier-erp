import type { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type WriteAuditInput = {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
};

export async function writeAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: WriteAuditInput) {
  return prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entity,
      entityId,
      details: details ?? undefined,
    },
  });
}
