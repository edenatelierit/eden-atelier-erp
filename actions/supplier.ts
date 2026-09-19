"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "@/lib/validations/supplier";

async function requireSupplierEditor() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage suppliers.");
  }
  assertRole(session.user.role, ["ACCOUNTANT", "SALES", "DESIGNER"]);
  return session.user.id;
}

function toOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveSupplier(raw: SupplierFormValues) {
  const parsed = supplierFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid supplier." };
  }

  try {
    const userId = await requireSupplierEditor();
    const existingId = parsed.data.id?.trim();
    const data = {
      name: parsed.data.name.trim(),
      category: parsed.data.category,
      contactPerson: toOptionalText(parsed.data.contactPerson),
      phone: toOptionalText(parsed.data.phone),
      email: toOptionalText(parsed.data.email)?.toLowerCase() ?? null,
      paymentTerms: toOptionalText(parsed.data.paymentTerms),
    };

    const record = existingId
      ? await prisma.supplier.update({
          where: { id: existingId },
          data,
        })
      : await prisma.supplier.create({ data });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Supplier",
      entityId: record.id,
      details: {
        name: record.name,
        category: record.category,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save supplier.";
    return { error: message };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const userId = await requireSupplierEditor();
    const existing = await prisma.supplier.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return { error: "Supplier not found." };
    }

    await prisma.supplier.delete({ where: { id } });
    await writeAuditLog({
      userId,
      action: "DELETE",
      entity: "Supplier",
      entityId: id,
      details: { name: existing.name },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete supplier.";
    return { error: message };
  }
}
