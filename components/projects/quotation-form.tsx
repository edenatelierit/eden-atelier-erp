"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { saveQuotation } from "@/actions/quotation";
import { useI18n } from "@/components/locale-provider";
import { PrintDocumentButton } from "@/components/print/print-document-button";
import type { PrintParty } from "@/components/print/print-template";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import {
  emptyQuotationValues,
  QUOTATION_STATUSES,
  quotationFormSchema,
  type QuotationFormValues,
} from "@/lib/validations/quotation";

function roundMoney(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function QuotationForm({
  projectId,
  initialValues,
  party,
}: {
  projectId: string;
  initialValues: QuotationFormValues | null;
  party: PrintParty;
}) {
  const { locale, t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: initialValues ?? emptyQuotationValues,
  });

  const values = form.watch();

  function applyTotals(subtotalRaw: string, vatRaw?: string) {
    const subtotal = Number(subtotalRaw) || 0;
    const vat =
      vatRaw === undefined
        ? Math.round(subtotal * 0.11 * 100) / 100
        : Number(vatRaw) || 0;
    form.setValue("subtotal", subtotalRaw);
    form.setValue("vat", roundMoney(vat));
    form.setValue("total", roundMoney(subtotal + vat));
  }

  async function onSubmit(data: QuotationFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveQuotation(projectId, data);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <CollapsibleCard
      title={t("quotation.title")}
      description={t("quotation.description")}
      actions={
        <PrintDocumentButton
          title={t("quotation.printTitle")}
          party={party}
          documentDate={values.validUntil}
        >
          <p className="whitespace-pre-wrap">{values.scopeSummary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-neutral-500">{t("quotation.subtotal")}</dt>
              <dd>{formatMoney(values.subtotal, locale)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("quotation.vat")}</dt>
              <dd>{formatMoney(values.vat, locale)}</dd>
            </div>
            <div className="col-span-2 border-t border-neutral-200 pt-2">
              <dt className="text-neutral-500">{t("quotation.total")}</dt>
              <dd className="text-lg font-semibold">{formatMoney(values.total, locale)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">{t("quotation.paymentTerms")}</dt>
              <dd>{values.paymentTerms}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("quotation.leadTimeWeeks")}</dt>
              <dd>{values.leadTimeWeeks}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("quotation.validUntil")}</dt>
              <dd>{values.validUntil}</dd>
            </div>
          </dl>
          <ul className="mt-4 list-disc ps-5">
            {values.kitchenScopeIncluded ? (
              <li>{t("quotation.kitchenScope")}</li>
            ) : null}
            {values.stoneScopeIncluded ? (
              <li>{t("quotation.stoneScope")}</li>
            ) : null}
            {values.exclusionsListed ? (
              <li>{t("quotation.exclusions")}</li>
            ) : null}
          </ul>
        </PrintDocumentButton>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FieldGroup>
            <FormGrid>
              <FormField
                span="full"
                data-invalid={!!form.formState.errors.scopeSummary}
              >
                <FieldLabel htmlFor="scopeSummary">
                  {t("quotation.scopeSummary")}
                </FieldLabel>
                <Textarea
                  id="scopeSummary"
                  rows={2}
                  {...form.register("scopeSummary")}
                />
                <FieldError errors={[form.formState.errors.scopeSummary]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.subtotal}>
                <FieldLabel htmlFor="subtotal">{t("quotation.subtotal")}</FieldLabel>
                <Input
                  id="subtotal"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("subtotal", {
                    onChange: (event) => applyTotals(event.target.value),
                  })}
                />
                <FieldError errors={[form.formState.errors.subtotal]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.vat}>
                <FieldLabel htmlFor="vat">{t("quotation.vat")}</FieldLabel>
                <Input
                  id="vat"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("vat", {
                    onChange: (event) =>
                      applyTotals(form.getValues("subtotal"), event.target.value),
                  })}
                />
                <FieldError errors={[form.formState.errors.vat]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.total}>
                <FieldLabel htmlFor="total">{t("quotation.total")}</FieldLabel>
                <Input id="total" type="number" min="0" step="0.01" readOnly {...form.register("total")} />
                <FieldError errors={[form.formState.errors.total]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.leadTimeWeeks}>
                <FieldLabel htmlFor="leadTimeWeeks">
                  {t("quotation.leadTimeWeeks")}
                </FieldLabel>
                <Input
                  id="leadTimeWeeks"
                  type="number"
                  min="0"
                  step="1"
                  {...form.register("leadTimeWeeks")}
                />
                <FieldError errors={[form.formState.errors.leadTimeWeeks]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.validUntil}>
                <FieldLabel htmlFor="validUntil">{t("quotation.validUntil")}</FieldLabel>
                <Input id="validUntil" type="date" {...form.register("validUntil")} />
                <FieldError errors={[form.formState.errors.validUntil]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.status}>
                <FieldLabel>{t("quotation.status")}</FieldLabel>
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
                          {t(`options.quotationStatuses.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start">
                        {QUOTATION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`options.quotationStatuses.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.status]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.paymentTerms}>
                <FieldLabel htmlFor="paymentTerms">
                  {t("quotation.paymentTerms")}
                </FieldLabel>
                <Input id="paymentTerms" {...form.register("paymentTerms")} />
                <FieldError errors={[form.formState.errors.paymentTerms]} />
              </FormField>
            </FormGrid>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  "kitchenScopeIncluded",
                  "stoneScopeIncluded",
                  "exclusionsListed",
                ] as const
              ).map((name) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                      {t(
                        name === "kitchenScopeIncluded"
                          ? "quotation.kitchenScope"
                          : name === "stoneScopeIncluded"
                            ? "quotation.stoneScope"
                            : "quotation.exclusions"
                      )}
                    </label>
                  )}
                />
              ))}
            </div>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("quotation.saved")}</p>
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
              t("quotation.save")
            )}
          </Button>
        </CardFooter>
      </Form>
    </CollapsibleCard>
  );
}
