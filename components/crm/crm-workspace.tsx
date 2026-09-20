"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { deleteClient } from "@/actions/client";
import {
  ClientFormPanel,
  type ClientRecord,
} from "@/components/crm/client-form-dialog";
import { ClientStatusBadge } from "@/components/crm/client-status-badge";
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

export function CrmWorkspace({
  clients,
  query,
}: {
  clients: ClientRecord[];
  query: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function startCreate() {
    setSelected(null);
    setOpen(true);
  }

  function startEdit(client: ClientRecord) {
    setSelected(client);
    setOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("crm.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("crm.subtitle")}</p>
        </div>
        <Button onClick={startCreate} className="w-full sm:w-auto">
          <Plus />
          {t("crm.addClient")}
        </Button>
      </div>

      <ClientFormPanel
        open={open}
        onOpenChange={setOpen}
        client={selected}
      />

      <Suspense fallback={<div className="h-8 max-w-sm rounded-lg border border-input bg-background" />}>
        <TableSearch />
      </Suspense>

      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">
              {query ? t("search.noResults") : t("crm.emptyTitle")}
            </p>
            {query ? null : (
              <>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("crm.emptyCopy")}
                </p>
                <Button onClick={startCreate}>
                  <Plus />
                  {t("crm.addClient")}
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
                  <TableHead>{t("crm.leadNo")}</TableHead>
                  <TableHead>{t("crm.clientCompany")}</TableHead>
                  <TableHead>{t("crm.contact")}</TableHead>
                  <TableHead>{t("crm.phoneEmail")}</TableHead>
                  <TableHead>{t("crm.source")}</TableHead>
                  <TableHead>{t("crm.status")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.leadNumber}
                    </TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.contactPerson || "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex min-w-40 flex-col">
                        <span>{client.phone}</span>
                        <span className="text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t(`options.leadSources.${client.source}`)}</TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => startEdit(client)}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(client);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {clients.map((client) => (
              <Card key={client.id} size="sm">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {client.leadNumber}
                      </p>
                      <p className="font-medium">{client.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClientStatusBadge status={client.status} />
                      <RowActions
                        onEdit={() => startEdit(client)}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(client);
                        }}
                      />
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("crm.contact")}</dt>
                      <dd>{client.contactPerson || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("crm.phoneEmail")}</dt>
                      <dd>
                        {client.phone}
                        <span className="block text-muted-foreground">
                          {client.email}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("crm.source")}</dt>
                      <dd>{t(`options.leadSources.${client.source}`)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null);
        }}
        title={t("crm.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteClient(pendingDelete.id);
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
