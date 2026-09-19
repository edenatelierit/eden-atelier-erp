import type { Metadata } from "next";

import { UsersWorkspace } from "@/components/admin/users-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "User Management",
};

export default async function UsersPage() {
  await requirePageAccess("/admin/users");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return <UsersWorkspace users={users} />;
}
