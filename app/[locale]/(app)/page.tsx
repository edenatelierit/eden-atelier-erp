import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Home() {
  const session = await auth();

  const [activeProjects, openServiceRequests, newLeads, pipeline, recentTickets] =
    await Promise.all([
      prisma.project.count({
        where: { status: { not: "COMPLETED" } },
      }),
      prisma.serviceRequest.count({
        where: { status: { in: ["OPEN", "WAITING_MATERIAL"] } },
      }),
      prisma.client.count({
        where: { status: "NEW" },
      }),
      prisma.project.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.serviceRequest.findMany({
        take: 5,
        orderBy: { dateReported: "desc" },
        select: {
          id: true,
          issue: true,
          status: true,
          dateReported: true,
          project: { select: { id: true, projectNumber: true } },
        },
      }),
    ]);

  return (
    <DashboardView
      role={session?.user?.role}
      metrics={{
        activeProjects,
        openServiceRequests,
        newLeads,
        pipeline: pipeline.map((row) => ({
          status: row.status,
          count: row._count._all,
        })),
        recentTickets: recentTickets.map((ticket) => ({
          id: ticket.id,
          issue: ticket.issue,
          status: ticket.status,
          projectId: ticket.project.id,
          projectNumber: ticket.project.projectNumber,
          dateReported: ticket.dateReported.toISOString(),
        })),
      }}
    />
  );
}
