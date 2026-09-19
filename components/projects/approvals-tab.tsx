"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  createDrawingApproval,
  createMaterialApproval,
} from "@/actions/approval";
import { ApprovalStatusBadge } from "@/components/projects/approval-status-badge";
import type {
  DrawingApprovalRow,
  MaterialApprovalRow,
} from "@/components/projects/project-hub-types";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { SupplierSelectField } from "@/components/suppliers/supplier-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/locale-provider";
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

function MaterialApprovalForm({
  projectId,
  suppliers,
}: {
  projectId: string;
  suppliers: SupplierOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<MaterialApprovalValues>({
    resolver: zodResolver(materialApprovalSchema),
    defaultValues: emptyMaterialApprovalValues,
  });

  async function onSubmit(values: MaterialApprovalValues) {
    setServerError(null);
    const result = await createMaterialApproval(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset(emptyMaterialApprovalValues);
    router.refresh();
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <FieldGroup>
        <FormGrid>
          <FormField data-invalid={!!form.formState.errors.itemLocation}>
            <FieldLabel htmlFor="itemLocation">{t("approvals.itemLocation")}</FieldLabel>
            <Input id="itemLocation" {...form.register("itemLocation")} />
            <FieldError errors={[form.formState.errors.itemLocation]} />
          </FormField>
          <FormField data-invalid={!!form.formState.errors.material}>
            <FieldLabel htmlFor="material">{t("approvals.material")}</FieldLabel>
            <Input id="material" {...form.register("material")} />
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
          <FormField data-invalid={!!form.formState.errors.thickness}>
            <FieldLabel htmlFor="thickness">{t("approvals.thickness")}</FieldLabel>
            <Input id="thickness" {...form.register("thickness")} />
            <FieldError errors={[form.formState.errors.thickness]} />
          </FormField>
          <FormField data-invalid={!!form.formState.errors.finish}>
            <FieldLabel htmlFor="finish">{t("approvals.finish")}</FieldLabel>
            <Input id="finish" {...form.register("finish")} />
            <FieldError errors={[form.formState.errors.finish]} />
          </FormField>
          <FormField data-invalid={!!form.formState.errors.status}>
            <FieldLabel>{t("approvals.status")}</FieldLabel>
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
                      {t(`options.approvalStatuses.${field.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {MATERIAL_APPROVAL_STATUSES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(`options.approvalStatuses.${item.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.status]} />
          </FormField>
          <FormField span="wide">
            <label className="flex h-8 items-center gap-2 text-sm">
              <Controller
                control={form.control}
                name="sampleAttached"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                )}
              />
              {t("approvals.sampleAttached")}
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
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              {t("approvals.saving")}
            </>
          ) : (
            t("approvals.logMaterial")
          )}
        </Button>
      </div>
    </Form>
  );
}

function DrawingApprovalForm({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<DrawingApprovalValues>({
    resolver: zodResolver(drawingApprovalSchema),
    defaultValues: emptyDrawingApprovalValues,
  });

  async function onSubmit(values: DrawingApprovalValues) {
    setServerError(null);
    const result = await createDrawingApproval(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset(emptyDrawingApprovalValues);
    router.refresh();
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-5">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field data-invalid={!!form.formState.errors.drawingNo}>
            <FieldLabel htmlFor="drawingNo">{t("approvals.drawingNo")}</FieldLabel>
            <Input
              id="drawingNo"
              placeholder="SD-K-01"
              {...form.register("drawingNo")}
            />
            <FieldError errors={[form.formState.errors.drawingNo]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor="drawingTitle">{t("approvals.title")}</FieldLabel>
            <Input
              id="drawingTitle"
              placeholder="Kitchen elevations"
              {...form.register("title")}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.revision}>
            <FieldLabel htmlFor="revision">{t("approvals.revision")}</FieldLabel>
            <Input
              id="revision"
              placeholder="A"
              {...form.register("revision")}
            />
            <FieldError errors={[form.formState.errors.revision]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.status}>
            <FieldLabel>{t("approvals.status")}</FieldLabel>
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
                      {t(`options.approvalStatuses.${field.value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {DRAWING_APPROVAL_STATUSES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(`options.approvalStatuses.${item.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.status]} />
          </Field>
          <Field
            className="sm:col-span-2"
            data-invalid={!!form.formState.errors.comments}
          >
            <FieldLabel htmlFor="drawingComments">{t("approvals.comments")}</FieldLabel>
            <Textarea
              id="drawingComments"
              rows={3}
              placeholder="Handle centres, appliance clearances…"
              {...form.register("comments")}
            />
            <FieldError errors={[form.formState.errors.comments]} />
          </Field>
        </div>
      </FieldGroup>

      {serverError ? (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              {t("approvals.saving")}
            </>
          ) : (
            t("approvals.logDrawing")
          )}
        </Button>
      </div>
    </Form>
  );
}

export function ApprovalsTab({
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

  return (
    <div className="grid grid-cols-1 gap-4">
      <CollapsibleCard
        title={t("approvals.materialsTitle")}
        description={t("approvals.materialsHint")}
      >
        <CardContent className="pt-4">
          <MaterialApprovalForm projectId={projectId} suppliers={suppliers} />
        </CardContent>
        {materials.length > 0 ? (
          <CardFooter className="flex-col items-stretch gap-3">
            <p className="text-sm font-medium">{t("approvals.loggedMaterials")}</p>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {materials.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.material}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.itemLocation} · {item.supplier}
                      </p>
                    </div>
                    <ApprovalStatusBadge kind="material" status={item.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.code")}</dt>
                      <dd>{item.productCode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.thickness")}</dt>
                      <dd>{item.thickness}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.finish")}</dt>
                      <dd>{item.finish}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("approvals.sample")}</dt>
                      <dd>{item.sampleAttached ? t("approvals.sampleYes") : t("approvals.sampleNo")}</dd>
                    </div>
                  </dl>
                  {item.comments ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.comments}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("approvals.photos")}
                    </p>
                    <ImageUpload
                      entityType="MATERIAL_APPROVAL"
                      entityId={item.id}
                      photos={item.photos}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardFooter>
        ) : null}
      </CollapsibleCard>

      <CollapsibleCard
        title={t("approvals.drawingsTitle")}
        description={t("approvals.drawingsHint")}
      >
        <CardContent className="pt-6">
          <DrawingApprovalForm projectId={projectId} />
        </CardContent>
        {drawings.length > 0 ? (
          <CardFooter className="flex-col items-stretch gap-3">
            <p className="text-sm font-medium">{t("approvals.loggedDrawings")}</p>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {drawings.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.drawingNo} · Rev {item.revision}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.title}
                      </p>
                    </div>
                    <ApprovalStatusBadge kind="drawing" status={item.status} />
                  </div>
                  {item.comments ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.comments}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardFooter>
        ) : null}
      </CollapsibleCard>
    </div>
  );
}
