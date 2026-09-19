"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createDeliveryNote, saveQualityControl } from "@/actions/logistics";
import { useI18n } from "@/components/locale-provider";
import type { DeliveryNoteRow } from "@/components/projects/project-hub-types";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  QC_CHECKS,
  deliveryNoteSchema,
  emptyDeliveryNoteValues,
  emptyQualityControlValues,
  qualityControlSchema,
  type DeliveryNoteValues,
  type QualityControlValues,
} from "@/lib/validations/logistics";

function QualityControlCard({
  projectId,
  initialValues,
}: {
  projectId: string;
  initialValues: QualityControlValues | null;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<QualityControlValues>({
    resolver: zodResolver(qualityControlSchema),
    defaultValues: initialValues ?? emptyQualityControlValues,
  });

  async function onSubmit(values: QualityControlValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveQualityControl(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <CollapsibleCard
      title={t("logisticsHub.qualityTitle")}
      description={t("logisticsHub.qualityHint")}
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-6 pt-6">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="inspector">
                  {t("logisticsHub.inspector")}
                </FieldLabel>
                <Input id="inspector" {...form.register("inspector")} />
                <FieldError errors={[form.formState.errors.inspector]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="workOrder">
                  {t("logisticsHub.workOrder")}
                </FieldLabel>
                <Input id="workOrder" {...form.register("workOrder")} />
                <FieldError errors={[form.formState.errors.workOrder]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="unitArea">
                  {t("logisticsHub.unitArea")}
                </FieldLabel>
                <Input id="unitArea" {...form.register("unitArea")} />
                <FieldError errors={[form.formState.errors.unitArea]} />
              </Field>
            </div>
          </FieldGroup>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {QC_CHECKS.map((name) => (
              <Controller
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <label className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={field.value}
                      onCheckedChange={(value) =>
                        field.onChange(value === true)
                      }
                    />
                    <span>{t(`options.qcChecks.${name}`)}</span>
                  </label>
                )}
              />
            ))}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">
              {t("logisticsHub.qualitySaved")}
            </p>
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
              t("logisticsHub.saveQuality")
            )}
          </Button>
        </CardFooter>
      </Form>
    </CollapsibleCard>
  );
}

function DeliveryNotesCard({
  projectId,
  notes,
}: {
  projectId: string;
  notes: DeliveryNoteRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<DeliveryNoteValues>({
    resolver: zodResolver(deliveryNoteSchema),
    defaultValues: emptyDeliveryNoteValues,
  });

  async function onSubmit(values: DeliveryNoteValues) {
    setServerError(null);
    setSaved(false);
    const result = await createDeliveryNote(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset(emptyDeliveryNoteValues);
    setSaved(true);
    router.refresh();
  }

  return (
    <CollapsibleCard
      title={t("logisticsHub.deliveryTitle")}
      description={t("logisticsHub.deliveryHint")}
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-5 pt-6">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deliveryDateTime">
                  {t("logisticsHub.deliveryDateTime")}
                </FieldLabel>
                <Input
                  id="deliveryDateTime"
                  type="datetime-local"
                  {...form.register("deliveryDateTime")}
                />
                <FieldError errors={[form.formState.errors.deliveryDateTime]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="vehicleDriver">
                  {t("logisticsHub.vehicleDriver")}
                </FieldLabel>
                <Input id="vehicleDriver" {...form.register("vehicleDriver")} />
                <FieldError errors={[form.formState.errors.vehicleDriver]} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="itemsDelivered">
                  {t("logisticsHub.itemsDelivered")}
                </FieldLabel>
                <Textarea
                  id="itemsDelivered"
                  rows={3}
                  {...form.register("itemsDelivered")}
                />
                <FieldError errors={[form.formState.errors.itemsDelivered]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="quantity">
                  {t("logisticsHub.quantity")}
                </FieldLabel>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  {...form.register("quantity")}
                />
                <FieldError errors={[form.formState.errors.quantity]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="conditionRemarks">
                  {t("logisticsHub.conditionRemarks")}
                </FieldLabel>
                <Input
                  id="conditionRemarks"
                  {...form.register("conditionRemarks")}
                />
              </Field>
            </div>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">
              {t("logisticsHub.deliverySaved")}
            </p>
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
              t("logisticsHub.logDelivery")
            )}
          </Button>
        </CardFooter>
      </Form>
      {notes.length > 0 ? (
        <CardFooter className="flex-col items-stretch gap-3 border-t">
          <p className="text-sm font-medium">
            {t("logisticsHub.loggedDeliveries")}
          </p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {notes.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="font-medium">{item.vehicleDriver}</p>
                <p className="text-sm text-muted-foreground">
                  {item.deliveryDateTime} · {item.quantity}
                </p>
                <p className="mt-2 text-sm">{item.itemsDelivered}</p>
                {item.conditionRemarks ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.conditionRemarks}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardFooter>
      ) : null}
    </CollapsibleCard>
  );
}

export function LogisticsTab({
  projectId,
  qualityControl,
  deliveryNotes,
}: {
  projectId: string;
  qualityControl: QualityControlValues | null;
  deliveryNotes: DeliveryNoteRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <QualityControlCard
        projectId={projectId}
        initialValues={qualityControl}
      />
      <DeliveryNotesCard projectId={projectId} notes={deliveryNotes} />
    </div>
  );
}
