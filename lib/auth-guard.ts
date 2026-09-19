import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { canAccessPath, isSuperAdmin } from "@/lib/rbac";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in.");
  }
  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export async function requirePageAccess(path: string) {
  const session = await auth();
  if (!session?.user?.role || !canAccessPath(session.user.role, path)) {
    redirect("/");
  }
  return session.user;
}

export async function requireAdminUser() {
  const user = await requireSession();
  if (!isSuperAdmin(user.role)) {
    throw new Error("Administrator access is required.");
  }
  return user;
}

export function assertRole(userRole: Role | undefined, allowed: Role[]) {
  if (!userRole || (userRole !== "SUPER_ADMIN" && !allowed.includes(userRole))) {
    throw new Error("You do not have permission for this action.");
  }
}
