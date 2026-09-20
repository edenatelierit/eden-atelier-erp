"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  deleteDrawingApproval,
  deleteMaterialApproval,
  saveDrawingApproval,
  saveMaterialApproval,
} from "@/actions/engineering";
import { ApprovalStatusBadge } from "@/components/projects/approval-status-badge";
import type {
  DrawingApprovalRow,
  MaterialApprovalRow,
} from "@/components/projects/project-hub-types";
import { useI18n } from "@/components/locale-provider";
import { SupplierSelectField } from "@/components/suppliers/supplier-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  ImageUploader,
  SHOP_DRAWING_ACCEPT,
} from "@/components/ui/image-uploader";
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
  DRAWING_APPROVAL_STATUSES,
  MATERIAL_APPROVAL_STATUSES,
} from "@/lib/approval-options";
import {
  drawingApprovalSchema,
  emptyDrawingApprovalValues,
  emptyMaterialApprovalValues,
  materialApprovalSchema,
  type DrawingApprovalValues,
  type MaterialApprovalValues,
} from "@/lib/validations/approval";
import type { SupplierOption } from "@/lib/validations/supplier";

function StatusSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string }[];
}) {
  const { t } = useI18n();
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{t(`options.approvalStatuses.${value}`)}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {t(`options.approvalStatuses.${item.value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MaterialPanel({
  open,
  onOpenChange,
  projectId,
  suppliers,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  suppliers: SupplierOption[];
  item: MaterialApprovalRow | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<MaterialApprovalValues>({
    resolver: zodResolver(materialApprovalSchema),
    defaultValues: emptyMaterialApprovalValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            itemLocation: item.itemLocation,
            material: item.material,
            supplierId: item.supplierId,
            productCode: item.productCode,
            thickness: item.thickness,
            finish: item.finish,
            hasPhysicalSample: item.hasPhysicalSample,
            hasPhotograph: item.hasPhotograph,
            hasTechnicalData: item.hasTechnicalData,
            status: item.status as MaterialApprovalValues["status"],
            comments: item.comments ?? "",
          }
        : emptyMaterialApprovalValues
    );
  }, [open, item, form]);

  async function onSubmit(values: MaterialApprovalValues) {
    setServerError(null);
    const result = await saveMaterialApproval(projectId, values);
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
      title={item ? t("common.edit") : t("approvals.logMaterial")}
      description={t("approvals.materialsHint")}
      className="mx-4 mb-4"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="material-approval-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("approvals.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </>
      }
    >
      <Form id="material-approval-form" form={form} onSubmit={onSubmit}>
          <FieldGroup>
            <FormGrid>
              <FormField span="wide" data-invalid={!!form.formState.errors.itemLocation}>
                <FieldLabel htmlFor="itemLocation">{t("approvals.itemLocation")}</FieldLabel>
                <Input id="itemLocation" {...form.register("itemLocation")} />
                <FieldError errors={[form.formState.errors.itemLocation]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.material}>
                <FieldLabel htmlFor="engMaterial">{t("approvals.material")}</FieldLabel>
                <Input id="engMaterial" {...form.register("material")} />
                <FieldError errors={[form.formState.errors.material]} />
              </FormField>
              <SupplierSelectField
                control={form.control}
                name="supplierId"
                suppliers={suppliers}
                error={form.formState.errors.supplierId}
              />
              <FormField data-invalid={!!form.formState.errors.productCode}>
                <FieldLabel htmlFor="productCode">{t("approvals.productCode")}</FieldLabel>
                <Input id="productCode" {...form.register("productCode")} />
                <FieldError errors={[form.formState.errors.productCode]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.status}>
                <FieldLabel>{t("approvals.status")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <StatusSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={MATERIAL_APPROVAL_STATUSES}
                    />
                  )}
                />
                <FieldError errors={[form.formState.errors.status]} />
              </FormField>
              <FormField>
                <label className="flex h-8 items-center gap-2 text-sm">
                  <Controller
                    control={form.control}
                    name="hasPhysicalSample"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                    )}
                  />
                  {t("approvals.hasPhysicalSample")}
                </label>
              </FormField>
              <FormField>
                <label className="flex h-8 items-center gap-2 text-sm">
                  <Controller
                    control={form.control}
                    name="hasPhotograph"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                    )}
                  />
                  {t("approvals.hasPhotograph")}
                </label>
              </FormField>
              <FormField>
                <label className="flex h-8 items-center gap-2 text-sm">
                  <Controller
                    control={form.control}
                    name="hasTechnicalData"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                    )}
                  />
                  {t("approvals.hasTechnicalData")}
                </label>
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.comments}>
                <FieldLabel htmlFor="materialComments">{t("approvals.comments")}</FieldLabel>
                <Input id="materialComments" {...form.register("comments")} />
                <FieldError errors={[form.formState.errors.comments]} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
        </Form>
    </InlineFormPanel>
  );
}

function DrawingPanel({
  open,
  onOpenChange,
  projectId,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item: DrawingApprovalRow | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<DrawingApprovalValues>({
    resolver: zodResolver(drawingApprovalSchema),
    defaultValues: emptyDrawingApprovalValues,
  });
  const fileUrl = useWatch({ control: form.control, name: "fileUrl" }) ?? "";

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            drawingNumber: item.drawingNumber,
            title: item.title,
            revision: item.revision,
            fileUrl: item.fileUrl ?? "",
            status: item.status as DrawingApprovalValues["status"],
            comments: item.comments ?? "",
          }
        : emptyDrawingApprovalValues
    );
  }, [open, item, form]);

  async function onSubmit(values: DrawingApprovalValues) {
    setServerError(null);
    const result = await saveDrawingApproval(projectId, values);
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
      title={item ? t("common.edit") : t("approvals.logDrawing")}
      description={t("approvals.drawingsHint")}
      className="mx-4 mb-4"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="drawing-approval-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("approvals.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </>
      }
    >
      <Form id="drawing-approval-form" form={form} onSubmit={onSubmit}>
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.drawingNumber}>
                <FieldLabel htmlFor="drawingNumber">{t("approvals.drawingNo")}</FieldLabel>
                <Input id="drawingNumber" placeholder="SD-K-01" {...form.register("drawingNumber")} />
                <FieldError errors={[form.formState.errors.drawingNumber]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="drawingTitle">{t("approvals.title")}</FieldLabel>
                <Input id="drawingTitle" {...form.register("title")} />
                <FieldError errors={[form.formState.errors.title]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.revision}>
                <FieldLabel htmlFor="revision">{t("approvals.revision")}</FieldLabel>
                <Input id="revision" placeholder="A" {...form.register("revision")} />
                <FieldError errors={[form.formState.errors.revision]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.status}>
                <FieldLabel>{t("approvals.status")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <StatusSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={DRAWING_APPROVAL_STATUSES}
                    />
                  )}
                />
                <FieldError errors={[form.formState.errors.status]} />
              </FormField>
              <FormField span="full">
                <FieldLabel>{t("approvals.file")}</FieldLabel>
                <ImageUploader
                  accept={SHOP_DRAWING_ACCEPT}
                  maxFiles={1}
                  urls={fileUrl ? [fileUrl] : []}
                  onChange={(urls) =>
                    form.setValue("fileUrl", urls[0] ?? "", { shouldDirty: true })
                  }
                />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.comments}>
                <FieldLabel htmlFor="drawingComments">{t("approvals.comments")}</FieldLabel>
                <Input id="drawingComments" {...form.register("comments")} />
                <FieldError errors={[form.formState.errors.comments]} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
        </Form>
    </InlineFormPanel>
  );
}

export function EngineeringTab({
  projectId,
  materials,
  drawings,
  suppliers,
}: {
  projectId: string;
  materials: MaterialApprovalRow[];
  drawings: DrawingApprovalRow[];
  suppliers: SupplierOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [materialOpen, setMaterialOpen] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialApprovalRow | null>(null);
  const [editingDrawing, setEditingDrawing] = useState<DrawingApprovalRow | null>(null);
  const [pendingMaterial, setPendingMaterial] = useState<MaterialApprovalRow | null>(null);
  const [pendingDrawing, setPendingDrawing] = useState<DrawingApprovalRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t("approvals.shopDrawings")}</CardTitle>
            <CardDescription>{t("approvals.drawingsHint")}</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingDrawing(null);
              setDrawingOpen(true);
            }}
          >
            <Plus />
            {t("approvals.logDrawing")}
          </Button>
        </CardHeader>
        <DrawingPanel
          open={drawingOpen}
          onOpenChange={setDrawingOpen}
          projectId={projectId}
          item={editingDrawing}
        />
        <CardContent className="pt-4">
          {drawings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("approvals.emptyDrawings")}</p>
          ) : (
            <ul className="space-y-3">
              {drawings.map((item) => (
                <li key={item.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.drawingNumber} · Rev {item.revision}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ApprovalStatusBadge kind="drawing" status={item.status} />
                      <RowActions
                        onEdit={() => {
                          setEditingDrawing(item);
                          setDrawingOpen(true);
                        }}
                        onDelete={() => setPendingDrawing(item)}
                      />
                    </div>
                  </div>
                  {item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <FileText className="size-3.5" />
                      {t("approvals.openFile")}
                    </a>
                  ) : null}
                  {item.comments ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.comments}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t("approvals.materialsTitle")}</CardTitle>
            <CardDescription>{t("approvals.materialsHint")}</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingMaterial(null);
              setMaterialOpen(true);
            }}
          >
            <Plus />
            {t("approvals.logMaterial")}
          </Button>
        </CardHeader>
        <MaterialPanel
          open={materialOpen}
          onOpenChange={setMaterialOpen}
          projectId={projectId}
          suppliers={suppliers}
          item={editingMaterial}
        />
        <CardContent className="pt-4">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("approvals.emptyMaterials")}</p>
          ) : (
            <ul className="space-y-3">
              {materials.map((item) => (
                <li key={item.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.material}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.itemLocation} · {item.supplier}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ApprovalStatusBadge kind="material" status={item.status} />
                      <RowActions
                        onEdit={() => {
                          setEditingMaterial(item);
                          setMaterialOpen(true);
                        }}
                        onDelete={() => setPendingMaterial(item)}
                      />
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.code")}</dt>
                      <dd>{item.productCode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.sample")}</dt>
                      <dd>
                        {item.hasPhysicalSample
                          ? t("approvals.sampleYes")
                          : t("approvals.sampleNo")}
                      </dd>
                    </div>
                  </dl>
                  {item.comments ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.comments}</p>
                  ) : null}
                  <div className="mt-3">
                    <ImageUpload
                      entityType="MATERIAL_APPROVAL"
                      entityId={item.id}
                      photos={item.photos}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(pendingMaterial)}
        onOpenChange={(open) => {
          if (!open) setPendingMaterial(null);
        }}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingMaterial) return;
          setDeleting(true);
          await deleteMaterialApproval(projectId, pendingMaterial.id);
          setDeleting(false);
          setPendingMaterial(null);
          router.refresh();
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingDrawing)}
        onOpenChange={(open) => {
          if (!open) setPendingDrawing(null);
        }}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDrawing) return;
          setDeleting(true);
          await deleteDrawingApproval(projectId, pendingDrawing.id);
          setDeleting(false);
          setPendingDrawing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
