import type { Metadata } from "next";

import { OpsProjectList } from "@/components/ops/ops-project-list";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Logistics",
};

export default async function LogisticsPage() {
  await requirePageAccess("/logistics");

  const projects = await prisma.project.findMany({
    where: { status: { in: ["LOGISTICS", "INSTALLATION"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectNumber: true,
      location: true,
      status: true,
      client: { select: { name: true } },
    },
  });

  return (
    <OpsProjectList
      titleKey="nav.logistics"
      subtitleKey="ops.logisticsSubtitle"
      projects={projects.map((project) => ({
        id: project.id,
        projectNumber: project.projectNumber,
        location: project.location,
        status: project.status,
        clientName: project.client.name,
      }))}
    />
  );
}
