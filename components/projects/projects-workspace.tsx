"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { deleteProject } from "@/actions/project";
import {
  ProjectFormDialog,
  type ProjectClientOption,
  type ProjectEditRecord,
} from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { RowActions } from "@/components/ui/row-actions";
import { TableSearch } from "@/components/table-search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/components/locale-provider";
import { withLocale } from "@/i18n/config";
import { formatBudget } from "@/lib/project-options";

export type ProjectRow = ProjectEditRecord & {
  projectNumber: string;
  status: string;
  clientName: string;
};

export function ProjectsWorkspace({
  projects,
  clients,
  query,
}: {
  projects: ProjectRow[];
  clients: ProjectClientOption[];
  query: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectEditRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function startCreate() {
    setSelected(null);
    setOpen(true);
  }

  function startEdit(project: ProjectRow) {
    setSelected(project);
    setOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("projects.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("projects.subtitle")}
          </p>
        </div>
        <Button
          onClick={startCreate}
          className="w-full sm:w-auto"
          disabled={clients.length === 0}
        >
          <Plus />
          {t("projects.newProject")}
        </Button>
      </div>

      {clients.length > 0 ? (
        <Suspense fallback={<div className="h-8 max-w-sm rounded-lg border border-input bg-background" />}>
          <TableSearch />
        </Suspense>
      ) : null}

      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-2 py-10">
            <p className="font-medium">{t("projects.emptyClientsTitle")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("projects.emptyClientsCopy")}
            </p>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">
              {query ? t("search.noResults") : t("projects.emptyTitle")}
            </p>
            {query ? null : (
              <>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("projects.emptyCopy")}
                </p>
                <Button onClick={startCreate}>
                  <Plus />
                  {t("projects.newProject")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("projects.projectNo")}</TableHead>
                  <TableHead>{t("projects.clientName")}</TableHead>
                  <TableHead>{t("projects.location")}</TableHead>
                  <TableHead>{t("projects.targetBudget")}</TableHead>
                  <TableHead>{t("projects.status")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <a
                        href={withLocale(locale, `/projects/${project.id}`)}
                        className="text-primary hover:underline"
                      >
                        {project.projectNumber}
                      </a>
                    </TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell className="whitespace-normal">
                      {project.location}
                    </TableCell>
                    <TableCell>{formatBudget(project.targetBudget)}</TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => startEdit(project)}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(project);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {projects.map((project) => (
              <Card key={project.id} size="sm">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        <a
                          href={withLocale(locale, `/projects/${project.id}`)}
                          className="text-primary hover:underline"
                        >
                          {project.projectNumber}
                        </a>
                      </p>
                      <p className="font-medium">{project.clientName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProjectStatusBadge status={project.status} />
                      <RowActions
                        onEdit={() => startEdit(project)}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(project);
                        }}
                      />
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("projects.location")}</dt>
                      <dd>{project.location}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("projects.targetBudget")}</dt>
                      <dd>{formatBudget(project.targetBudget)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ProjectFormDialog
        open={open}
        onOpenChange={setOpen}
        clients={clients}
        project={selected}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null);
        }}
        title={t("projects.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteProject(pendingDelete.id);
          setDeleting(false);
          if (result.error) {
            setDeleteError(result.error);
            return;
          }
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
