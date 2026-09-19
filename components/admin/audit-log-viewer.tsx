"use client";

import type { AuditAction } from "@prisma/client";

import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withLocale } from "@/i18n/config";

const AUDIT_ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE"];

export type AuditLogRow = {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  userName: string | null;
  userEmail: string | null;
};

function actionVariant(action: AuditAction) {
  if (action === "DELETE") return "destructive" as const;
  if (action === "UPDATE") return "secondary" as const;
  return "outline" as const;
}

export function AuditLogViewer({
  logs,
  entities,
  action,
  entity,
  page,
  pageCount,
  total,
}: {
  logs: AuditLogRow[];
  entities: string[];
  action: string;
  entity: string;
  page: number;
  pageCount: number;
  total: number;
}) {
  const { locale, t } = useI18n();

  function hrefFor(next: { action?: string; entity?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextAction = next.action ?? action;
    const nextEntity = next.entity ?? entity;
    const nextPage = next.page ?? 1;
    if (nextAction) params.set("action", nextAction);
    if (nextEntity) params.set("entity", nextEntity);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return withLocale(
      locale,
      query ? `/admin/audit-logs?${query}` : "/admin/audit-logs"
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("nav.admin")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("admin.auditTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("admin.auditSubtitle")}
        </p>
      </div>

      <form
        method="get"
        action={withLocale(locale, "/admin/audit-logs")}
        className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-end"
      >
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-muted-foreground">{t("admin.filterAction")}</span>
            <select
              name="action"
              defaultValue={action}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">{t("admin.allActions")}</option>
              {AUDIT_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-muted-foreground">{t("admin.filterEntity")}</span>
            <select
              name="entity"
              defaultValue={entity}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">{t("admin.allEntities")}</option>
              {entities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" variant="outline">
          {t("admin.applyFilters")}
        </Button>
      </form>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            {t("admin.emptyLogs")}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("admin.timestamp")}</TableHead>
                <TableHead>{t("admin.user")}</TableHead>
                <TableHead>{t("admin.action")}</TableHead>
                <TableHead>{t("admin.entity")}</TableHead>
                <TableHead>{t("admin.entityId")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString(
                      locale === "ar" ? "ar" : "en-GB",
                      { dateStyle: "medium", timeStyle: "short" }
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-40">
                      <p className="font-medium">
                        {log.userName ?? t("admin.system")}
                      </p>
                      {log.userEmail ? (
                        <p className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(log.action)} className="font-mono">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.entity}</TableCell>
                  <TableCell
                    className="max-w-40 truncate font-mono text-xs text-muted-foreground"
                    title={log.entityId}
                  >
                    {log.entityId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("admin.showing")} {total} · {t("admin.page")} {page}
          {pageCount > 0 ? ` / ${pageCount}` : ""}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={hrefFor({ page: page - 1 })} />}
            >
              {t("admin.previous")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("admin.previous")}
            </Button>
          )}
          {page < pageCount ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={hrefFor({ page: page + 1 })} />}
            >
              {t("admin.next")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("admin.next")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
