import { BOOTSTRAP_ADMIN } from "@/lib/bootstrap-admin";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultAdmin() {
  const email = BOOTSTRAP_ADMIN.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.user.create({
    data: {
      name: BOOTSTRAP_ADMIN.name,
      email,
      passwordHash: await hashPassword(BOOTSTRAP_ADMIN.password),
      role: "SUPER_ADMIN",
    },
  });
}
