import type { Metadata } from "next";

import { OpsProjectList } from "@/components/ops/ops-project-list";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Production",
};

export default async function ProductionPage() {
  await requirePageAccess("/production");

  const projects = await prisma.project.findMany({
    where: { status: { in: ["DESIGN", "PRODUCTION"] } },
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
      titleKey="nav.production"
      subtitleKey="ops.productionSubtitle"
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
