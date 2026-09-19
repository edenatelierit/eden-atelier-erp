"use server";

import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertRole } from "@/lib/auth-guard";
import {
  invoiceVatUsd,
  roundByCurrency,
  roundUsd,
  usdToLbp,
  type AppCurrency,
} from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { revalidateWorkspace } from "@/lib/revalidate";
import {
  invoiceFormSchema,
  type InvoiceFormValues,
} from "@/lib/validations/invoice";

async function requireInvoiceUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("You must be signed in to manage invoices.");
  }
  assertRole(session.user.role, ["SALES", "ACCOUNTANT"]);
  return session.user.id;
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const sequence = latest
    ? Number(latest.invoiceNumber.slice(prefix.length)) + 1
    : 1;
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

function invoiceTotals(input: {
  subtotal: number;
  vat: number;
  total: number;
  currency: AppCurrency;
  rate: number;
}) {
  const subtotal = roundByCurrency(input.subtotal, input.currency);
  const vat =
    input.vat > 0
      ? roundByCurrency(input.vat, input.currency)
      : input.currency === "USD"
        ? invoiceVatUsd(subtotal)
        : Math.round(subtotal * 0.11);
  const total =
    input.total > 0
      ? roundByCurrency(input.total, input.currency)
      : roundByCurrency(subtotal + vat, input.currency);
  const vatUsd = input.currency === "USD" ? vat : roundUsd(vat / input.rate);
  const vatAmountLbp =
    input.currency === "LBP" ? vat : usdToLbp(vatUsd, input.rate);
  const totalLbp =
    input.currency === "LBP" ? total : usdToLbp(total, input.rate);

  return { subtotal, vat, total, vatAmountLbp, totalLbp };
}

export async function saveInvoice(projectId: string, raw: InvoiceFormValues) {
  const parsed = invoiceFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invoice." };
  }

  try {
    const userId = await requireInvoiceUser();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true },
    });
    if (!project) {
      return { error: "Project not found." };
    }

    const currency = parsed.data.currency;
    const exchangeRateLbp = Number(parsed.data.exchangeRateLbp);
    const totals = invoiceTotals({
      subtotal: Number(parsed.data.subtotal),
      vat: Number(parsed.data.vat),
      total: Number(parsed.data.total),
      currency,
      rate: exchangeRateLbp,
    });
    const existingId = parsed.data.id?.trim();
    if (existingId) {
      const existing = await prisma.invoice.findFirst({
        where: { id: existingId, projectId },
        select: { id: true },
      });
      if (!existing) {
        return { error: "Invoice not found." };
      }
    }
    const data = {
      issueDate: new Date(`${parsed.data.issueDate}T00:00:00.000Z`),
      dueDate: new Date(`${parsed.data.dueDate}T00:00:00.000Z`),
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      currency,
      exchangeRateLbp,
      vatAmountLbp: totals.vatAmountLbp,
      totalLbp: totals.totalLbp,
      mofNumber: parsed.data.mofNumber.trim(),
      tvaNumber: parsed.data.tvaNumber.trim(),
      crNumber: parsed.data.crNumber.trim(),
      status: parsed.data.status,
      stageName: parsed.data.stageName ?? null,
    };

    const record = existingId
      ? await prisma.invoice.update({
          where: { id: existingId },
          data,
        })
      : await prisma.invoice.create({
          data: {
            projectId,
            invoiceNumber: await nextInvoiceNumber(),
            ...data,
          },
        });

    await writeAuditLog({
      userId,
      action: existingId ? "UPDATE" : "CREATE",
      entity: "Invoice",
      entityId: record.id,
      details: {
        projectId,
        projectNumber: project.projectNumber,
        invoiceNumber: record.invoiceNumber,
        currency: record.currency,
        total: record.total,
        vatAmountLbp: record.vatAmountLbp,
        totalLbp: record.totalLbp,
        exchangeRateLbp: record.exchangeRateLbp,
        status: record.status,
        stageName: record.stageName,
      },
    });

    revalidateWorkspace();
    return { success: true as const, id: record.id };
  } catch (error) {
    if (isMissingTable(error)) {
      return { error: "Invoice tables are not available yet." };
    }
    const message =
      error instanceof Error ? error.message : "Unable to save invoice.";
    return { error: message };
  }
}
