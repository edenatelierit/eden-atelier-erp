import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { roundUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "Dashboard",
};

function toUsd(amount: number, currency: "USD" | "LBP", rate?: number | null) {
  if (currency === "USD") return roundUsd(amount);
  if (!rate || rate <= 0) return 0;
  return roundUsd(amount / rate);
}

async function loadMoneySnapshot() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  try {
    const [todayLines, openInvoices, openOrders, stockItems] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: start, lt: end } },
        select: {
          type: true,
          amount: true,
          currency: true,
          exchangeRate: true,
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE"] } },
        select: { total: true, currency: true, exchangeRateLbp: true },
      }),
      prisma.purchaseOrder.findMany({
        select: {
          qty: true,
          unitPrice: true,
          receivingNotes: { select: { receivedQty: true } },
        },
      }),
      prisma.inventoryItem.findMany({
        select: { quantityInStock: true, minimumThreshold: true },
      }),
    ]);

    const cashIn = todayLines
      .filter((line) => line.type === "INCOME")
      .reduce(
        (sum, line) => sum + toUsd(line.amount, line.currency, line.exchangeRate),
        0
      );
    const cashOut = todayLines
      .filter((line) => line.type === "EXPENSE")
      .reduce(
        (sum, line) => sum + toUsd(line.amount, line.currency, line.exchangeRate),
        0
      );
    const receivables = openInvoices.reduce(
      (sum, invoice) =>
        sum + toUsd(invoice.total, invoice.currency, invoice.exchangeRateLbp),
      0
    );
    const payables = openOrders.reduce((sum, order) => {
      const received = order.receivingNotes.reduce(
        (qty, note) => qty + note.receivedQty,
        0
      );
      const remaining = Math.max(order.qty - received, 0);
      return sum + remaining * order.unitPrice;
    }, 0);

    return {
      cashIn: roundUsd(cashIn),
      cashOut: roundUsd(cashOut),
      receivables: roundUsd(receivables),
      payables: roundUsd(payables),
      lowStock: stockItems.filter(
        (item) => item.quantityInStock < item.minimumThreshold
      ).length,
    };
  } catch (error) {
    if (isMissingTable(error)) {
      return { cashIn: 0, cashOut: 0, receivables: 0, payables: 0, lowStock: 0 };
    }
    throw error;
  }
}

export default async function Home() {
  const session = await auth();

  const [
    activeProjects,
    openServiceRequests,
    newLeads,
    pipeline,
    recentTickets,
    money,
  ] = await Promise.all([
    prisma.project.count({
      where: { status: { not: "COMPLETED" } },
    }),
    prisma.serviceRequest.count({
      where: { status: { in: ["OPEN", "WAITING_MATERIAL"] } },
    }),
    prisma.client.count({
      where: { status: "NEW" },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: { dateReported: "desc" },
      select: {
        id: true,
        issue: true,
        status: true,
        dateReported: true,
        project: { select: { id: true, projectNumber: true } },
      },
    }),
    loadMoneySnapshot(),
  ]);

  return (
    <DashboardView
      role={session?.user?.role}
      metrics={{
        activeProjects,
        openServiceRequests,
        newLeads,
        pipeline: pipeline.map((row) => ({
          status: row.status,
          count: row._count._all,
        })),
        recentTickets: recentTickets.map((ticket) => ({
          id: ticket.id,
          issue: ticket.issue,
          status: ticket.status,
          projectId: ticket.project.id,
          projectNumber: ticket.project.projectNumber,
          dateReported: ticket.dateReported.toISOString(),
        })),
        ...money,
      }}
    />
  );
}
