"use server";

import { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { requireAdminUser } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  userFormSchema,
  type UserFormValues,
} from "@/lib/validations/user";

function normalizePassword(password?: string) {
  const trimmed = password?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "";
}

export async function createUser(raw: UserFormValues) {
  const parsed = userFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid user data." };
  }

  const password = normalizePassword(parsed.data.password);
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const admin = await requireAdminUser();
    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        passwordHash: await hashPassword(password),
      },
    });

    await writeAuditLog({
      userId: admin.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      details: { name: user.name, email: user.email, role: user.role },
    });

    revalidateWorkspace();
    return { success: true as const, id: user.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A user with this email already exists." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to create user.";
    return { error: message };
  }
}

export async function updateUser(id: string, raw: UserFormValues) {
  const parsed = userFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid user data." };
  }

  try {
    const admin = await requireAdminUser();
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      return { error: "User not found." };
    }

    if (
      existing.role === "SUPER_ADMIN" &&
      parsed.data.role !== "SUPER_ADMIN"
    ) {
      const remainingAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", id: { not: id } },
      });
      if (remainingAdmins === 0) {
        return { error: "The workspace must keep at least one SUPER_ADMIN." };
      }
    }

    const password = normalizePassword(parsed.data.password);
    if (password && password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });

    await writeAuditLog({
      userId: admin.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      details: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordChanged: Boolean(password),
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: user.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A user with this email already exists." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to update user.";
    return { error: message };
  }
}

export async function deleteUser(id: string) {
  try {
    const admin = await requireAdminUser();
    if (admin.id === id) {
      return { error: "You cannot delete your own account." };
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!existing) {
      return { error: "User not found." };
    }

    if (existing.role === "SUPER_ADMIN") {
      const remainingAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", id: { not: id } },
      });
      if (remainingAdmins === 0) {
        return { error: "The workspace must keep at least one SUPER_ADMIN." };
      }
    }

    await prisma.user.delete({ where: { id } });
    await writeAuditLog({
      userId: admin.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      details: {
        name: existing.name,
        email: existing.email,
        role: existing.role,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete user.";
    return { error: message };
  }
}
