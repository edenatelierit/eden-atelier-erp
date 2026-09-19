import { DEMO_ADMIN } from "@/lib/client-options";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultAdmin() {
  const email = DEMO_ADMIN.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.user.create({
    data: {
      name: DEMO_ADMIN.name,
      email,
      passwordHash: await hashPassword(DEMO_ADMIN.password),
      role: "SUPER_ADMIN",
    },
  });
}
