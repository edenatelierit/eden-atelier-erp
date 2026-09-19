"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { saveInvoice } from "@/actions/invoice";
import { useI18n } from "@/components/locale-provider";
import { PrintInvoiceButton } from "@/components/print/print-invoice";
import type { PrintParty } from "@/components/print/print-template";
import type { PaymentStageRow } from "@/components/projects/project-hub-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CompanyLegal } from "@/lib/company";
import {
  CURRENCIES,
  formatMoney,
  invoiceVatUsd,
  roundByCurrency,
  usdToLbp,
} from "@/lib/money";
import {
  PAYMENT_STAGE_KEYS,
  type PaymentStageKey,
} from "@/lib/validations/finance";
import {
  INVOICE_STATUSES,
  emptyInvoiceValues,
  invoiceFormSchema,
  type InvoiceFormValues,
  type InvoiceStatusValue,
} from "@/lib/validations/invoice";

function isPaymentStage(value: string | null): value is PaymentStageKey {
  return PAYMENT_STAGE_KEYS.includes(value as PaymentStageKey);
}

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  currency: "USD" | "LBP";
  exchangeRateLbp: number;
  vatAmountLbp: number;
  totalLbp: number;
  mofNumber: string;
  tvaNumber: string;
  crNumber: string;
  status: InvoiceStatusValue;
  stageName: string | null;
};

function displayStatus(row: InvoiceRow): InvoiceStatusValue {
  if (row.status === "SENT" && row.dueDate < new Date().toISOString().slice(0, 10)) {
    return "OVERDUE";
  }
  return row.status;
}

export function InvoicesTab({
  projectId,
  invoices,
  stages,
  party,
  companyLegal,
}: {
  projectId: string;
  invoices: InvoiceRow[];
  stages: PaymentStageRow[];
  party: PrintParty;
  companyLegal: CompanyLegal;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const defaults = useMemo(
    () => ({
      ...emptyInvoiceValues,
      mofNumber: companyLegal.mofNumber,
      tvaNumber: companyLegal.tvaNumber,
      crNumber: companyLegal.crNumber,
    }),
    [companyLegal]
  );

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaults,
  });

  const values = form.watch();
  const selectedInvoice = invoices.find((row) => row.id === values.id);
  const stageOptions = stages.length
    ? stages.map((stage) => stage.stageName)
    : [...PAYMENT_STAGE_KEYS];
  const selectedStage = useMemo(
    () => stages.find((stage) => stage.stageName === values.stageName),
    [stages, values.stageName]
  );
  const currency = values.currency;
  const rate = Number(values.exchangeRateLbp) || 0;
  const subtotalNumber = Number(values.subtotal) || 0;
  const vatNumber =
    Number(values.vat) ||
    (currency === "USD" ? invoiceVatUsd(subtotalNumber) : Math.round(subtotalNumber * 0.11));
  const totalNumber = Number(values.total) || roundByCurrency(subtotalNumber + vatNumber, currency);
  const vatAmountLbp =
    selectedInvoice && values.id === selectedInvoice.id
      ? selectedInvoice.vatAmountLbp
      : currency === "LBP"
        ? vatNumber
        : rate
          ? usdToLbp(vatNumber, rate)
          : 0;
  const totalLbp =
    selectedInvoice && values.id === selectedInvoice.id
      ? selectedInvoice.totalLbp
      : currency === "LBP"
        ? totalNumber
        : rate
          ? usdToLbp(totalNumber, rate)
          : 0;

  function applyStageAmounts(stageName: string) {
    const stage = stages.find((item) => item.stageName === stageName);
    if (!stage) return;
    const subtotal = roundByCurrency(stage.amount, "USD");
    const vat = invoiceVatUsd(subtotal);
    form.setValue("currency", "USD");
    form.setValue("subtotal", subtotal.toFixed(2));
    form.setValue("vat", vat.toFixed(2));
    form.setValue("total", roundByCurrency(subtotal + vat, "USD").toFixed(2));
  }

  useEffect(() => {
    if (values.id || values.subtotal) return;
    if (selectedStage) applyStageAmounts(selectedStage.stageName);
    // Prefill a new invoice from the payment stage once stages load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStage?.id, values.id]);

  function loadInvoice(row: InvoiceRow) {
    form.reset({
      id: row.id,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      subtotal: row.subtotal.toFixed(row.currency === "LBP" ? 0 : 2),
      vat: row.vat.toFixed(row.currency === "LBP" ? 0 : 2),
      total: row.total.toFixed(row.currency === "LBP" ? 0 : 2),
      currency: row.currency,
      exchangeRateLbp: row.exchangeRateLbp ? String(row.exchangeRateLbp) : "",
      mofNumber: row.mofNumber,
      tvaNumber: row.tvaNumber,
      crNumber: row.crNumber,
      status: row.status,
      stageName: isPaymentStage(row.stageName) ? row.stageName : "deposit",
    });
    setSaved(false);
    setServerError(null);
  }

  async function onSubmit(data: InvoiceFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveInvoice(projectId, data);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset(defaults);
    setSaved(true);
    router.refresh();
  }

  return (
    <CollapsibleCard
      title={t("invoices.title")}
      description={t("invoices.description")}
      actions={
        <PrintInvoiceButton
          party={party}
          invoice={{
            invoiceNumber: selectedInvoice?.invoiceNumber,
            issueDate: values.issueDate,
            dueDate: values.dueDate,
            stageName: values.stageName,
            currency,
            subtotal: subtotalNumber,
            vat: vatNumber,
            total: totalNumber,
            exchangeRateLbp: rate,
            vatAmountLbp,
            totalLbp,
            mofNumber: values.mofNumber,
            tvaNumber: values.tvaNumber,
            crNumber: values.crNumber,
            status: values.status,
          }}
        />
      }
    >
      <CardContent className="pt-4">
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField>
                <FieldLabel>{t("invoices.stage")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="stageName"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? stageOptions[0] ?? "deposit"}
                      onValueChange={(value) => {
                        if (!value) return;
                        field.onChange(value);
                        applyStageAmounts(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(
                            `options.paymentStages.${field.value || "deposit"}`
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {stageOptions.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`options.paymentStages.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.status}>
                <FieldLabel>{t("invoices.status")}</FieldLabel>
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
                          {t(`options.invoiceStatuses.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {INVOICE_STATUSES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.invoiceStatuses.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField>
                <FieldLabel>{t("invoices.currency")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.currencies.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {CURRENCIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.currencies.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.exchangeRateLbp}>
                <FieldLabel htmlFor="inv-rate">{t("invoices.exchangeRate")}</FieldLabel>
                <Input
                  id="inv-rate"
                  type="number"
                  min="1"
                  step="1"
                  {...form.register("exchangeRateLbp")}
                />
                <FieldError errors={[form.formState.errors.exchangeRateLbp]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.issueDate}>
                <FieldLabel htmlFor="inv-issue">{t("invoices.issueDate")}</FieldLabel>
                <Input id="inv-issue" type="date" {...form.register("issueDate")} />
                <FieldError errors={[form.formState.errors.issueDate]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.dueDate}>
                <FieldLabel htmlFor="inv-due">{t("invoices.dueDate")}</FieldLabel>
                <Input id="inv-due" type="date" {...form.register("dueDate")} />
                <FieldError errors={[form.formState.errors.dueDate]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.mofNumber}>
                <FieldLabel htmlFor="inv-mof">{t("invoices.mofNumber")}</FieldLabel>
                <Input id="inv-mof" {...form.register("mofNumber")} />
                <FieldError errors={[form.formState.errors.mofNumber]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.tvaNumber}>
                <FieldLabel htmlFor="inv-tva">{t("invoices.tvaNumber")}</FieldLabel>
                <Input id="inv-tva" {...form.register("tvaNumber")} />
                <FieldError errors={[form.formState.errors.tvaNumber]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.crNumber}>
                <FieldLabel htmlFor="inv-cr">{t("invoices.crNumber")}</FieldLabel>
                <Input id="inv-cr" {...form.register("crNumber")} />
                <FieldError errors={[form.formState.errors.crNumber]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.subtotal}>
                <FieldLabel htmlFor="inv-sub">{t("invoices.subtotal")}</FieldLabel>
                <Input
                  id="inv-sub"
                  type="number"
                  min="0"
                  step={currency === "LBP" ? "1" : "0.01"}
                  {...form.register("subtotal", {
                    onChange: (event) => {
                      const subtotal = Number(event.target.value) || 0;
                      const vat =
                        currency === "USD"
                          ? invoiceVatUsd(subtotal)
                          : Math.round(subtotal * 0.11);
                      form.setValue("vat", vat.toFixed(currency === "LBP" ? 0 : 2));
                      form.setValue(
                        "total",
                        roundByCurrency(subtotal + vat, currency).toFixed(
                          currency === "LBP" ? 0 : 2
                        )
                      );
                    },
                  })}
                />
                <FieldError errors={[form.formState.errors.subtotal]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.vat}>
                <FieldLabel htmlFor="inv-vat">{t("invoices.vat")}</FieldLabel>
                <Input
                  id="inv-vat"
                  type="number"
                  min="0"
                  step={currency === "LBP" ? "1" : "0.01"}
                  {...form.register("vat", {
                    onChange: (event) => {
                      const subtotal = Number(form.getValues("subtotal")) || 0;
                      const vat = Number(event.target.value) || 0;
                      form.setValue(
                        "total",
                        roundByCurrency(subtotal + vat, currency).toFixed(
                          currency === "LBP" ? 0 : 2
                        )
                      );
                    },
                  })}
                />
                <FieldError errors={[form.formState.errors.vat]} />
              </FormField>
              <FormField>
                <FieldLabel>{t("invoices.total")}</FieldLabel>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted px-2.5 text-sm font-medium">
                  {formatMoney(values.total, locale, currency)}
                </div>
              </FormField>
              <FormField span="wide">
                <FieldLabel>{t("invoices.vatLbpAt")}</FieldLabel>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted px-2.5 text-sm font-medium">
                  {rate
                    ? `${formatMoney(vatAmountLbp, locale, "LBP")} @ ${rate.toLocaleString(locale === "ar" ? "ar" : "en-US")}`
                    : "—"}
                </div>
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("invoices.saved")}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            {values.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(defaults);
                  setSaved(false);
                  setServerError(null);
                }}
              >
                {t("invoices.add")}
              </Button>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("invoices.save")
              )}
            </Button>
          </div>
        </Form>

        {invoices.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("invoices.empty")}</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("invoices.invoiceNumber")}</TableHead>
                  <TableHead>{t("invoices.stage")}</TableHead>
                  <TableHead>{t("invoices.dueDate")}</TableHead>
                  <TableHead>{t("invoices.total")}</TableHead>
                  <TableHead>{t("invoices.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((row) => {
                  const status = displayStatus(row);
                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => loadInvoice(row)}
                    >
                      <TableCell className="font-medium">{row.invoiceNumber}</TableCell>
                      <TableCell>
                        {row.stageName
                          ? t(`options.paymentStages.${row.stageName}`)
                          : "—"}
                      </TableCell>
                      <TableCell>{row.dueDate}</TableCell>
                      <TableCell>{formatMoney(row.total, locale, row.currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "PAID"
                              ? "default"
                              : status === "OVERDUE"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {t(`options.invoiceStatuses.${status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </CollapsibleCard>
  );
}
