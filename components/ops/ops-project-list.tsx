"use client";

import Link from "next/link";

import { useI18n } from "@/components/locale-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { withLocale } from "@/i18n/config";
import type { ProjectStatus } from "@prisma/client";

export type OpsProjectRow = {
  id: string;
  projectNumber: string;
  location: string;
  status: ProjectStatus;
  clientName: string;
};

export function OpsProjectList({
  titleKey,
  subtitleKey,
  projects,
}: {
  titleKey: string;
  subtitleKey: string;
  projects: OpsProjectRow[];
}) {
  const { locale, t } = useI18n();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t(titleKey)}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t(subtitleKey)}</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            {t("dashboard.noProjects")}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("projects.projectNo")}</TableHead>
                <TableHead>{t("projects.clientName")}</TableHead>
                <TableHead>{t("projects.location")}</TableHead>
                <TableHead>{t("projects.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={withLocale(locale, `/projects/${project.id}`)}
                      className="hover:underline"
                    >
                      {project.projectNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{project.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.location}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={project.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
