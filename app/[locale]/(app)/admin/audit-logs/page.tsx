import type { AuditAction } from "@prisma/client";
import type { Metadata } from "next";

import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Audit Logs",
};

const PAGE_SIZE = 25;
const ACTIONS = new Set<AuditAction>(["CREATE", "UPDATE", "DELETE"]);

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>;
}) {
  await requirePageAccess("/admin/audit-logs");

  const params = await searchParams;
  const action = ACTIONS.has(params.action as AuditAction)
    ? (params.action as AuditAction)
    : undefined;
  const entity = params.entity?.trim() || undefined;
  const requestedPage = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
  };

  const [total, entityRows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      timestamp: true,
      action: true,
      entity: true,
      entityId: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <AuditLogViewer
      action={action ?? ""}
      entity={entity ?? ""}
      page={Math.min(page, pageCount)}
      pageCount={pageCount}
      total={total}
      entities={entityRows.map((row) => row.entity)}
      logs={logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userName: log.user?.name ?? null,
        userEmail: log.user?.email ?? null,
      }))}
    />
  );
}
