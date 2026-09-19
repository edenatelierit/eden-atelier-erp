import type { Prisma } from "@prisma/client";

export function normalizeSearchQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function clientSearchWhere(
  query: string
): Prisma.ClientWhereInput | undefined {
  const q = query.trim();
  if (!q) return undefined;
  return {
    OR: [
      { name: { contains: q } },
      { leadNumber: { contains: q } },
      { contactPerson: { contains: q } },
    ],
  };
}

export function supplierSearchWhere(
  query: string
): Prisma.SupplierWhereInput | undefined {
  const q = query.trim();
  if (!q) return undefined;
  return {
    OR: [
      { name: { contains: q } },
      { contactPerson: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ],
  };
}

export function projectSearchWhere(
  query: string
): Prisma.ProjectWhereInput | undefined {
  const q = query.trim();
  if (!q) return undefined;
  return {
    OR: [
      { projectNumber: { contains: q } },
      { location: { contains: q } },
      { client: { name: { contains: q } } },
    ],
  };
}
