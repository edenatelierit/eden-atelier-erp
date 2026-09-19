import type { Metadata } from "next";

import { SuppliersWorkspace } from "@/components/suppliers/suppliers-workspace";
import { requirePageAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { normalizeSearchQuery, supplierSearchWhere } from "@/lib/search";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  await requirePageAccess("/suppliers");
  const query = normalizeSearchQuery((await searchParams).query);
  const where = supplierSearchWhere(query);

  let suppliers: Awaited<ReturnType<typeof prisma.supplier.findMany>> = [];
  try {
    suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (!isMissingTable(error)) {
      throw error;
    }
  }

  return (
    <SuppliersWorkspace
      query={query}
      suppliers={suppliers.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        contactPerson: item.contactPerson,
        phone: item.phone,
        email: item.email,
        paymentTerms: item.paymentTerms,
      }))}
    />
  );
}
