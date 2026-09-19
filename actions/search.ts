"use server";

import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { canAccessPath } from "@/lib/rbac";
import { clientSearchWhere, projectSearchWhere } from "@/lib/search";

const LIMIT = 8;

export type GlobalSearchClient = {
  id: string;
  name: string;
  leadNumber: string;
};

export type GlobalSearchProject = {
  id: string;
  projectNumber: string;
  location: string;
  clientName: string;
};

export async function searchWorkspace(query: string) {
  const user = await requireSession();
  const term = query.trim();
  const clientWhere = clientSearchWhere(term);
  const projectWhere = projectSearchWhere(term);
  const canCrm = canAccessPath(user.role, "/crm");

  const [clients, projects] = await Promise.all([
    canCrm
      ? prisma.client.findMany({
          where: clientWhere,
          orderBy: { updatedAt: "desc" },
          take: LIMIT,
          select: { id: true, name: true, leadNumber: true },
        })
      : Promise.resolve([]),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        projectNumber: true,
        location: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  return {
    clients,
    projects: projects.map((project) => ({
      id: project.id,
      projectNumber: project.projectNumber,
      location: project.location,
      clientName: project.client.name,
    })),
  };
}
