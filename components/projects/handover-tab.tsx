"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  deleteServiceRequest,
  saveHandoverCertificate,
  saveServiceRequest,
} from "@/actions/handover";
import { useI18n } from "@/components/locale-provider";
import { PrintDocumentButton } from "@/components/print/print-document-button";
import type { PrintParty } from "@/components/print/print-template";
import type { ServiceRequestRow } from "@/components/projects/project-hub-types";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { ImageUpload } from "@/components/ui/image-upload";
import { ImageUploader } from "@/components/ui/image-uploader";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { Input } from "@/components/ui/input";
import { RowActions } from "@/components/ui/row-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  HANDOVER_CHECKS,
  SERVICE_STATUSES,
  WARRANTY_STATUSES,
  emptyHandoverValues,
  emptyServiceRequestValues,
  handoverCertificateSchema,
  serviceRequestSchema,
  type HandoverCertificateValues,
  type ServiceRequestValues,
} from "@/lib/validations/handover";
import type { PhotoItem } from "@/lib/photos";

function HandoverCard({
  projectId,
  initialValues,
  photos,
  party,
}: {
  projectId: string;
  initialValues: HandoverCertificateValues | null;
  photos: PhotoItem[];
  party: PrintParty;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<HandoverCertificateValues>({
    resolver: zodResolver(handoverCertificateSchema),
    defaultValues: {
      ...(initialValues ?? emptyHandoverValues),
      photoUrls: initialValues?.photoUrls?.length
        ? initialValues.photoUrls
        : photos.map((photo) => photo.url),
    },
  });
  const values = form.watch();
  const photoUrls = values.photoUrls;

  async function onSubmit(data: HandoverCertificateValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveHandoverCertificate(projectId, data);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <CollapsibleCard
      title={t("handover.title")}
      description={t("handover.description")}
      actions={
        <PrintDocumentButton
          title={t("handover.printTitle")}
          party={party}
          documentDate={values.handoverDate}
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-neutral-500">{t("handover.handoverDate")}</dt>
              <dd>{values.handoverDate || "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">{t("handover.outstanding")}</dt>
              <dd className="whitespace-pre-wrap">
                {values.outstandingItems || "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">{t("handover.remarks")}</dt>
              <dd>{values.remarks || "—"}</dd>
            </div>
          </dl>
          <ul className="mt-4 list-disc ps-5">
            {HANDOVER_CHECKS.filter((name) => values[name]).map((name) => (
              <li key={name}>{t(`options.handoverChecks.${name}`)}</li>
            ))}
          </ul>
          {photoUrls.length > 0 ? (
            <div className="mt-6 grid grid-cols-3 gap-2">
              {photoUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-28 w-full object-cover"
                />
              ))}
            </div>
          ) : null}
        </PrintDocumentButton>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.handoverDate}>
                <FieldLabel htmlFor="handoverDate">
                  {t("handover.handoverDate")}
                </FieldLabel>
                <Input
                  id="handoverDate"
                  type="date"
                  {...form.register("handoverDate")}
                />
                <FieldError errors={[form.formState.errors.handoverDate]} />
              </FormField>
            </FormGrid>
            <div>
              <p className="mb-2 text-sm font-medium">{t("handover.checklist")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HANDOVER_CHECKS.map((name) => (
                  <Controller
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
                        />
                        {t(`options.handoverChecks.${name}`)}
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>
            <FormGrid>
              <FormField span="wide">
                <FieldLabel htmlFor="outstandingItems">
                  {t("handover.outstanding")}
                </FieldLabel>
                <Textarea
                  id="outstandingItems"
                  rows={2}
                  {...form.register("outstandingItems")}
                />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="handoverRemarks">
                  {t("handover.remarks")}
                </FieldLabel>
                <Input
                  id="handoverRemarks"
                  {...form.register("remarks")}
                />
              </FormField>
              <FormField span="full">
                <FieldLabel>{t("handover.snagPhotos")}</FieldLabel>
                <ImageUploader
                  urls={photoUrls}
                  onChange={(next) =>
                    form.setValue("photoUrls", next, { shouldDirty: true })
                  }
                />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("handover.saved")}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("handover.save")
            )}
          </Button>
        </CardFooter>
      </Form>
    </CollapsibleCard>
  );
}

function ServiceRequestDialog({
  projectId,
  open,
  onOpenChange,
  request,
  photos,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ServiceRequestValues | null;
  photos: PhotoItem[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(request?.id);

  const form = useForm<ServiceRequestValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: emptyServiceRequestValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(request ?? emptyServiceRequestValues);
  }, [open, request, form]);

  async function onSubmit(values: ServiceRequestValues) {
    setServerError(null);
    const result = await saveServiceRequest(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <InlineFormPanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? t("service.editRequest") : t("service.newRequest")}
      description={t("service.description")}
      className="mb-4"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="service-request-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("service.save")
            )}
          </Button>
        </>
      }
    >
      <Form
        id="service-request-form"
        form={form}
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <FieldGroup>
          <FormGrid>
            <FormField data-invalid={!!form.formState.errors.dateReported}>
              <FieldLabel htmlFor="dateReported">
                {t("service.dateReported")}
              </FieldLabel>
              <Input
                id="dateReported"
                type="date"
                {...form.register("dateReported")}
              />
              <FieldError errors={[form.formState.errors.dateReported]} />
            </FormField>
            <FormField>
              <FieldLabel>{t("service.warrantyStatus")}</FieldLabel>
              <Controller
                control={form.control}
                name="warrantyStatus"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {t(`options.warrantyStatuses.${field.value}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {WARRANTY_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`options.warrantyStatuses.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField>
              <FieldLabel>{t("service.status")}</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {t(`options.serviceStatuses.${field.value}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {SERVICE_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`options.serviceStatuses.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              span="medium"
              data-invalid={!!form.formState.errors.technician}
            >
              <FieldLabel htmlFor="technician">
                {t("service.technician")}
              </FieldLabel>
              <Input id="technician" {...form.register("technician")} />
              <FieldError errors={[form.formState.errors.technician]} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="visitDate">{t("service.visitDate")}</FieldLabel>
              <Input
                id="visitDate"
                type="date"
                {...form.register("visitDate")}
              />
            </FormField>
            <FormField span="wide" data-invalid={!!form.formState.errors.issue}>
              <FieldLabel htmlFor="issue">{t("service.issue")}</FieldLabel>
              <Input id="issue" {...form.register("issue")} />
              <FieldError errors={[form.formState.errors.issue]} />
            </FormField>
            <FormField span="wide">
              <FieldLabel htmlFor="diagnosis">{t("service.diagnosis")}</FieldLabel>
              <Input id="diagnosis" {...form.register("diagnosis")} />
            </FormField>
            {request?.id ? (
              <FormField span="full">
                <FieldLabel>{t("service.photos")}</FieldLabel>
                <ImageUpload
                  entityType="SERVICE_REQUEST"
                  entityId={request.id}
                  photos={photos}
                />
              </FormField>
            ) : null}
          </FormGrid>
        </FieldGroup>
        {serverError ? (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        ) : null}
      </Form>
    </InlineFormPanel>
  );
}

function ServiceRequestsCard({
  projectId,
  requests,
}: {
  projectId: string;
  requests: ServiceRequestRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceRequestValues | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceRequestRow | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function startCreate() {
    setSelected(null);
    setDialogOpen(true);
  }

  function startEdit(row: ServiceRequestRow) {
    setSelected({
      id: row.id,
      dateReported: row.dateReported,
      issue: row.issue,
      warrantyStatus: row.warrantyStatus,
      technician: row.technician,
      visitDate: row.visitDate ?? "",
      diagnosis: row.diagnosis ?? "",
      status: row.status,
    });
    setDialogOpen(true);
  }

  return (
    <CollapsibleCard
      title={t("service.title")}
      description={t("service.description")}
      actions={
        <Button type="button" variant="outline" onClick={startCreate}>
          <Plus />
          {t("service.newRequest")}
        </Button>
      }
    >
      <CardContent className="pt-4">
        <ServiceRequestDialog
          projectId={projectId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          request={selected}
          photos={
            selected?.id
              ? requests.find((row) => row.id === selected.id)?.photos ?? []
              : []
          }
        />
        {deleteError ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}
        {requests.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{t("service.empty")}</p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("service.dateReported")}</TableHead>
                  <TableHead>{t("service.issue")}</TableHead>
                  <TableHead>{t("service.warrantyStatus")}</TableHead>
                  <TableHead>{t("service.technician")}</TableHead>
                  <TableHead>{t("service.status")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.dateReported}</TableCell>
                    <TableCell className="whitespace-normal">{row.issue}</TableCell>
                    <TableCell>
                      {t(`options.warrantyStatuses.${row.warrantyStatus}`)}
                    </TableCell>
                    <TableCell>{row.technician}</TableCell>
                    <TableCell>
                      {t(`options.serviceStatuses.${row.status}`)}
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => startEdit(row)}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(row);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("service.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteServiceRequest(projectId, pendingDelete.id);
          setDeleting(false);
          if (result.error) {
            setDeleteError(result.error);
            return;
          }
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </CollapsibleCard>
  );
}

export function HandoverTab({
  projectId,
  handover,
  handoverPhotos,
  serviceRequests,
  party,
}: {
  projectId: string;
  handover: HandoverCertificateValues | null;
  handoverPhotos: PhotoItem[];
  serviceRequests: ServiceRequestRow[];
  party: PrintParty;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <HandoverCard
        projectId={projectId}
        initialValues={handover}
        photos={handoverPhotos}
        party={party}
      />
      <ServiceRequestsCard projectId={projectId} requests={serviceRequests} />
    </div>
  );
}
