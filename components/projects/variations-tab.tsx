"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { createVariationOrder, updateVariationStatus } from "@/actions/variation";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import {
  emptyVariationValues,
  revisedContractValue,
  variationOrderSchema,
  type VariationOrderValues,
  type VariationStatusValue,
} from "@/lib/validations/variation";

export type VariationOrderRow = {
  id: string;
  voNumber: string;
  date: string;
  requestedBy: string;
  originalContractValue: number;
  scopeVariation: string;
  reason: string;
  costImpact: number;
  timeImpactDays: number;
  revisedContractValue: number;
  status: VariationStatusValue;
};

const STATUS_VARIANT: Record<
  VariationStatusValue,
  "outline" | "secondary" | "default" | "destructive"
> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function VariationsTab({
  projectId,
  originalContractValue,
  orders,
}: {
  projectId: string;
  originalContractValue: string;
  orders: VariationOrderRow[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const form = useForm<VariationOrderValues>({
    resolver: zodResolver(variationOrderSchema),
    defaultValues: {
      ...emptyVariationValues,
      originalContractValue: originalContractValue || "",
    },
  });

  const watched = form.watch(["originalContractValue", "costImpact"]);
  const revised = useMemo(
    () => revisedContractValue(watched[0] ?? "", watched[1] ?? ""),
    [watched]
  );

  useEffect(() => {
    if (originalContractValue && !form.getValues("originalContractValue")) {
      form.setValue("originalContractValue", originalContractValue);
    }
  }, [originalContractValue, form]);

  async function onSubmit(values: VariationOrderValues) {
    setServerError(null);
    setSaved(false);
    const result = await createVariationOrder(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset({
      ...emptyVariationValues,
      originalContractValue: originalContractValue || values.originalContractValue,
    });
    setSaved(true);
    router.refresh();
  }

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setServerError(null);
    setPendingId(id);
    const result = await updateVariationStatus(projectId, { id, status });
    setPendingId(null);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <CollapsibleCard
      title={t("variation.title")}
      description={t("variation.description")}
    >
      <CardContent className="pt-4">
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.date}>
                <FieldLabel htmlFor="vo-date">{t("variation.date")}</FieldLabel>
                <Input id="vo-date" type="date" {...form.register("date")} />
                <FieldError errors={[form.formState.errors.date]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.requestedBy}>
                <FieldLabel htmlFor="vo-requested">
                  {t("variation.requestedBy")}
                </FieldLabel>
                <Input id="vo-requested" {...form.register("requestedBy")} />
                <FieldError errors={[form.formState.errors.requestedBy]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.originalContractValue}>
                <FieldLabel htmlFor="vo-original">
                  {t("variation.originalValue")}
                </FieldLabel>
                <Input
                  id="vo-original"
                  type="number"
                  step="0.01"
                  {...form.register("originalContractValue")}
                />
                <FieldError errors={[form.formState.errors.originalContractValue]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.costImpact}>
                <FieldLabel htmlFor="vo-impact">
                  {t("variation.costImpact")}
                </FieldLabel>
                <Input
                  id="vo-impact"
                  type="number"
                  step="0.01"
                  {...form.register("costImpact")}
                />
                <FieldError errors={[form.formState.errors.costImpact]} />
              </FormField>
              <FormField>
                <FieldLabel>{t("variation.revisedValue")}</FieldLabel>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted px-2.5 text-sm font-medium">
                  {revised || "—"}
                </div>
              </FormField>
              <FormField data-invalid={!!form.formState.errors.timeImpactDays}>
                <FieldLabel htmlFor="vo-days">{t("variation.timeImpact")}</FieldLabel>
                <Input
                  id="vo-days"
                  type="number"
                  step="1"
                  {...form.register("timeImpactDays")}
                />
                <FieldError errors={[form.formState.errors.timeImpactDays]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.scopeVariation}>
                <FieldLabel htmlFor="vo-scope">{t("variation.scope")}</FieldLabel>
                <Input id="vo-scope" {...form.register("scopeVariation")} />
                <FieldError errors={[form.formState.errors.scopeVariation]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.reason}>
                <FieldLabel htmlFor="vo-reason">{t("variation.reason")}</FieldLabel>
                <Input id="vo-reason" {...form.register("reason")} />
                <FieldError errors={[form.formState.errors.reason]} />
              </FormField>
            </FormGrid>
          </FieldGroup>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("variation.saved")}</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("variation.save")
              )}
            </Button>
          </div>
        </Form>

        {orders.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("variation.empty")}</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("variation.voNumber")}</TableHead>
                  <TableHead>{t("variation.date")}</TableHead>
                  <TableHead>{t("variation.costImpact")}</TableHead>
                  <TableHead>{t("variation.revisedValue")}</TableHead>
                  <TableHead>{t("variation.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.voNumber}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{formatMoney(order.costImpact, locale)}</TableCell>
                    <TableCell>{formatMoney(order.revisedContractValue, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status]}>
                        {t(`options.variationStatuses.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      {order.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={pendingId === order.id}
                            onClick={() => decide(order.id, "APPROVED")}
                          >
                            {t("variation.approve")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pendingId === order.id}
                            onClick={() => decide(order.id, "REJECTED")}
                          >
                            {t("variation.reject")}
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </CollapsibleCard>
  );
}
