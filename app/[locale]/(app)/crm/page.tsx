import type { Metadata } from "next";

import { CrmWorkspace } from "@/components/crm/crm-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { clientSearchWhere, normalizeSearchQuery } from "@/lib/search";

export const metadata: Metadata = {
  title: "CRM",
};

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  await requirePageAccess("/crm");
  const query = normalizeSearchQuery((await searchParams).query);
  const where = clientSearchWhere(query);

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      leadNumber: true,
      name: true,
      contactPerson: true,
      phone: true,
      email: true,
      source: true,
      status: true,
    },
  });

  return <CrmWorkspace clients={clients} query={query} />;
}
