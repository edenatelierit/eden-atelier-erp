"use client";

import type { ProjectStatus, Role } from "@prisma/client";
import {
  FolderKanban,
  Headset,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canAccessPath } from "@/lib/rbac";
import { withLocale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";

export type DashboardMetrics = {
  activeProjects: number;
  openServiceRequests: number;
  newLeads: number;
  pipeline: { status: ProjectStatus; count: number }[];
  recentTickets: {
    id: string;
    issue: string;
    status: string;
    projectId: string;
    projectNumber: string;
    dateReported: string;
  }[];
  cashIn: number;
  cashOut: number;
  receivables: number;
  payables: number;
  lowStock: number;
};

const PIPELINE_ORDER: ProjectStatus[] = [
  "LEAD",
  "SURVEY",
  "DESIGN",
  "PRODUCTION",
  "LOGISTICS",
  "INSTALLATION",
  "ON_HOLD",
  "COMPLETED",
];

export function DashboardView({
  metrics,
  role,
}: {
  metrics: DashboardMetrics;
  role?: Role;
}) {
  const { locale, t } = useI18n();
  const canCrm = canAccessPath(role, "/crm");
  const canProjects = canAccessPath(role, "/projects");
  const canFinance = canAccessPath(role, "/finance");
  const canInventory = canAccessPath(role, "/inventory");

  const cards = [
    {
      key: "projects",
      label: t("dashboard.activeProjects"),
      hint: t("dashboard.activeProjectsHint"),
      value: metrics.activeProjects,
      icon: FolderKanban,
      href: canProjects ? "/projects" : null,
    },
    {
      key: "service",
      label: t("dashboard.openService"),
      hint: t("dashboard.openServiceHint"),
      value: metrics.openServiceRequests,
      icon: Headset,
      href: canProjects ? "/projects" : null,
    },
    {
      key: "leads",
      label: t("dashboard.newLeads"),
      hint: t("dashboard.newLeadsHint"),
      value: metrics.newLeads,
      icon: UserPlus,
      href: canCrm ? "/crm" : null,
    },
  ];

  const pipeline = PIPELINE_ORDER.map((status) => ({
    status,
    count: metrics.pipeline.find((row) => row.status === status)?.count ?? 0,
  })).filter((row) => row.count > 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("dashboard.greeting")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("dashboard.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("dashboard.intro")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const content = (
            <Card className="h-full transition-colors hover:ring-foreground/20">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="font-heading text-4xl tabular-nums tracking-tight">
                    {card.value}
                  </CardTitle>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <card.icon className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );

          return card.href ? (
            <Link
              key={card.key}
              href={withLocale(locale, card.href)}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          ) : (
            <div key={card.key}>{content}</div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            key: "in",
            label: t("dashboard.cashIn"),
            hint: t("dashboard.cashInHint"),
            value: formatMoney(metrics.cashIn, locale),
            href: canFinance ? "/finance" : null,
          },
          {
            key: "out",
            label: t("dashboard.cashOut"),
            hint: t("dashboard.cashOutHint"),
            value: formatMoney(metrics.cashOut, locale),
            href: canFinance ? "/finance" : null,
          },
          {
            key: "recv",
            label: t("dashboard.receivables"),
            hint: t("dashboard.receivablesHint"),
            value: formatMoney(metrics.receivables, locale),
            href: canFinance ? "/finance" : null,
          },
          {
            key: "pay",
            label: t("dashboard.payables"),
            hint: t("dashboard.payablesHint"),
            value: formatMoney(metrics.payables, locale),
            href: canInventory ? "/inventory" : canFinance ? "/finance" : null,
          },
        ].map((card) => {
          const content = (
            <Card className="h-full">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="font-heading text-2xl tabular-nums tracking-tight">
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.hint}</p>
                {card.key === "pay" && metrics.lowStock > 0 ? (
                  <p className="mt-2 text-sm text-destructive">
                    {t("dashboard.lowStockCount")}: {metrics.lowStock}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
          return card.href ? (
            <Link
              key={card.key}
              href={withLocale(locale, card.href)}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          ) : (
            <div key={card.key}>{content}</div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.pipeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.noProjects")}
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {pipeline.map((row) => (
                  <li
                    key={row.status}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm">
                      {t(`options.projectStatuses.${row.status}`)}
                    </span>
                    <span className="font-heading text-lg tabular-nums">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.recentService")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.noService")}
              </p>
            ) : (
              metrics.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={withLocale(locale, `/projects/${ticket.projectId}`)}
                  className="block rounded-lg bg-muted/50 px-3 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ticket.issue}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.projectNumber}
                      </p>
                    </div>
                    <Badge variant="outline">{ticket.status}</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
