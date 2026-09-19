import type { Metadata } from "next";

import { HrWorkspace } from "@/components/hr/hr-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";

export const metadata: Metadata = {
  title: "Human Resources",
};

export default async function HrPage() {
  await requirePageAccess("/hr");

  const projects = await prisma.project.findMany({
    orderBy: { projectNumber: "desc" },
    select: { id: true, projectNumber: true },
  });

  try {
    const [employees, timesheets] = await Promise.all([
      prisma.employee.findMany({ orderBy: { name: "asc" } }),
      prisma.timesheet.findMany({
        orderBy: { date: "desc" },
        take: 200,
        include: {
          employee: { select: { name: true, dailyRate: true } },
          project: { select: { projectNumber: true } },
        },
      }),
    ]);

    return (
      <HrWorkspace
        projects={projects}
        employees={employees.map((item) => ({
          id: item.id,
          name: item.name,
          position: item.position,
          phone: item.phone,
          dailyRate: item.dailyRate,
          status: item.status,
        }))}
        timesheets={timesheets.map((item) => ({
          id: item.id,
          employeeId: item.employeeId,
          employeeName: item.employee.name,
          dailyRate: item.employee.dailyRate,
          projectId: item.projectId,
          projectNumber: item.project?.projectNumber ?? null,
          date: item.date.toISOString().slice(0, 10),
          hoursWorked: item.hoursWorked,
          notes: item.notes,
        }))}
      />
    );
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  return <HrWorkspace projects={projects} employees={[]} timesheets={[]} />;
}
