import type { Metadata } from "next";

import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { prisma } from "@/lib/prisma";
import { normalizeSearchQuery, projectSearchWhere } from "@/lib/search";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const query = normalizeSearchQuery((await searchParams).query);
  const search = projectSearchWhere(query);

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: { not: "COMPLETED" },
        ...(search ?? {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientId: true,
        projectNumber: true,
        location: true,
        targetBudget: true,
        targetCompletionDate: true,
        preferredStyle: true,
        preferredWood: true,
        preferredStone: true,
        preferredColors: true,
        preferredHardware: true,
        areasIncluded: true,
        status: true,
        client: { select: { name: true } },
      },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        leadNumber: true,
      },
    }),
  ]);

  return (
    <ProjectsWorkspace
      query={query}
      projects={projects.map((project) => ({
        id: project.id,
        clientId: project.clientId,
        projectNumber: project.projectNumber,
        location: project.location,
        targetBudget: project.targetBudget?.toString() ?? null,
        targetCompletionDate: project.targetCompletionDate
          ? project.targetCompletionDate.toISOString().slice(0, 10)
          : null,
        preferredStyle: project.preferredStyle,
        preferredWood: project.preferredWood,
        preferredStone: project.preferredStone,
        preferredColors: project.preferredColors,
        preferredHardware: project.preferredHardware,
        areasIncluded: Array.isArray(project.areasIncluded)
          ? project.areasIncluded.filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        status: project.status,
        clientName: project.client.name,
      }))}
      clients={clients}
    />
  );
}
