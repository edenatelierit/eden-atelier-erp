"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  employeeFormSchema,
  timesheetFormSchema,
  type EmployeeFormValues,
  type TimesheetFormValues,
} from "@/lib/validations/hr";

async function requireHrUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage HR.");
  }
  assertRole(session.user.role, ["ACCOUNTANT"]);
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveEmployee(raw: EmployeeFormValues) {
  const parsed = employeeFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid employee." };
  }

  try {
    const userId = await requireHrUser();
    const existingId = parsed.data.id?.trim();
    const data = {
      name: parsed.data.name.trim(),
      position: parsed.data.position.trim(),
      phone: parsed.data.phone.trim(),
      dailyRate: Number(parsed.data.dailyRate),
      status: parsed.data.status,
    };

    const record = existingId
      ? await prisma.employee.update({ where: { id: existingId }, data })
      : await prisma.employee.create({ data });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Employee",
      entityId: record.id,
      details: { name: record.name, position: record.position },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "HR tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save employee.";
    return { error: message };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const userId = await requireHrUser();
    const existing = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return { error: "Employee not found." };
    }

    await prisma.employee.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "Employee",
      entityId: id,
      details: { name: existing.name },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "HR tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete employee.";
    return { error: message };
  }
}

export async function saveTimesheet(raw: TimesheetFormValues) {
  const parsed = timesheetFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid timesheet." };
  }

  try {
    const userId = await requireHrUser();
    const projectId = toOptionalText(parsed.data.projectId);
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) {
        return { error: "Selected project was not found." };
      }
    }

    const existingId = parsed.data.id?.trim();
    const data = {
      employeeId: parsed.data.employeeId,
      projectId,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      hoursWorked: Number(parsed.data.hoursWorked),
      notes: toOptionalText(parsed.data.notes),
    };

    const record = existingId
      ? await prisma.timesheet.update({ where: { id: existingId }, data })
      : await prisma.timesheet.create({ data });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Timesheet",
      entityId: record.id,
      details: {
        employeeId: record.employeeId,
        projectId: record.projectId,
        hoursWorked: record.hoursWorked,
        date: record.date.toISOString().slice(0, 10),
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "HR tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save timesheet.";
    return { error: message };
  }
}

export async function deleteTimesheet(id: string) {
  try {
    const userId = await requireHrUser();
    const existing = await prisma.timesheet.findUnique({
      where: { id },
      select: { id: true, employeeId: true, hoursWorked: true },
    });
    if (!existing) {
      return { error: "Timesheet not found." };
    }

    await prisma.timesheet.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "Timesheet",
      entityId: id,
      details: {
        employeeId: existing.employeeId,
        hoursWorked: existing.hoursWorked,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "HR tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete timesheet.";
    return { error: message };
  }
}
