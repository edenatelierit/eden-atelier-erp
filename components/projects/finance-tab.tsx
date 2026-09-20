"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { updatePayment } from "@/actions/finance";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
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
  emptyUpdatePaymentValues,
  paymentBalance,
  paymentStatus,
  updatePaymentSchema,
  type PaymentStatusValue,
  type UpdatePaymentValues,
} from "@/lib/validations/finance";

export type PaymentStageRow = {
  id: string;
  stageName: string;
  percentage: number;
  amount: number;
  dueDate: string | null;
  invoiceRef: string | null;
  paidDate: string | null;
  amountPaid: number;
  balance: number;
  status: PaymentStatusValue;
  notes: string | null;
};

const STATUS_VARIANT: Record<
  PaymentStatusValue,
  "outline" | "secondary" | "default"
> = {
  PENDING: "outline",
  PARTIAL: "secondary",
  PAID: "default",
};

function UpdatePaymentPanel({
  projectId,
  stage,
  open,
  onOpenChange,
}: {
  projectId: string;
  stage: PaymentStageRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<UpdatePaymentValues>({
    resolver: zodResolver(updatePaymentSchema),
    defaultValues: emptyUpdatePaymentValues,
  });

  useEffect(() => {
    if (!open || !stage) return;
    setServerError(null);
    form.reset({
      id: stage.id,
      amountPaid: String(stage.amountPaid),
      paidDate: stage.paidDate ?? "",
      invoiceRef: stage.invoiceRef ?? "",
      notes: stage.notes ?? "",
    });
  }, [open, stage, form]);

  const amountPaidWatch = Number(form.watch("amountPaid") || 0);
  const preview = useMemo(() => {
    if (!stage || Number.isNaN(amountPaidWatch)) {
      return { balance: 0, status: "PENDING" as PaymentStatusValue };
    }
    const paid = Math.max(0, amountPaidWatch);
    return {
      balance: paymentBalance(stage.amount, paid),
      status: paymentStatus(stage.amount, paid),
    };
  }, [amountPaidWatch, stage]);

  async function onSubmit(values: UpdatePaymentValues) {
    setServerError(null);
    const result = await updatePayment(projectId, values);
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
      title={t("finance.updatePayment")}
      description={
        stage
          ? t(`options.paymentStages.${stage.stageName}`)
          : t("finance.description")
      }
      className="mx-4 mb-4"
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
            form="update-payment-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("finance.savePayment")
            )}
          </Button>
        </>
      }
    >
      <Form id="update-payment-form" form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.amountPaid}>
                <FieldLabel htmlFor="amountPaid">
                  {t("finance.amountPaid")}
                </FieldLabel>
                <Input
                  id="amountPaid"
                  type="number"
                  min={0}
                  step="0.01"
                  {...form.register("amountPaid")}
                />
                <FieldError errors={[form.formState.errors.amountPaid]} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="paidDate">{t("finance.paidDate")}</FieldLabel>
                <Input id="paidDate" type="date" {...form.register("paidDate")} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="invoiceRef">
                  {t("finance.invoiceRef")}
                </FieldLabel>
                <Input id="invoiceRef" {...form.register("invoiceRef")} />
              </FormField>
              <FormField>
                <FieldLabel>{t("finance.balance")}</FieldLabel>
                <p className="flex h-8 items-center text-sm font-medium">
                  {formatMoney(preview.balance, locale)}
                </p>
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="paymentNotes">{t("finance.notes")}</FieldLabel>
                <Input id="paymentNotes" {...form.register("notes")} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          <p className="text-sm text-muted-foreground">
            {t("finance.status")}: {t(`options.paymentStatuses.${preview.status}`)}
          </p>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
        </Form>
    </InlineFormPanel>
  );
}

export function FinanceTab({
  projectId,
  stages,
}: {
  projectId: string;
  stages: PaymentStageRow[];
}) {
  const { locale, t } = useI18n();
  const [selected, setSelected] = useState<PaymentStageRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const totalAmount = stages.reduce((sum, stage) => sum + stage.amount, 0);
  const totalPaid = stages.reduce((sum, stage) => sum + stage.amountPaid, 0);
  const totalBalance = stages.reduce((sum, stage) => sum + stage.balance, 0);

  return (
    <CollapsibleCard
      title={t("finance.title")}
      description={t("finance.description")}
    >
      <UpdatePaymentPanel
        projectId={projectId}
        stage={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <CardContent className="pt-4">
        {stages.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t("finance.empty")}
          </p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="min-w-[40rem] overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t("finance.stage")}</TableHead>
                    <TableHead>{t("finance.percentage")}</TableHead>
                    <TableHead>{t("finance.amount")}</TableHead>
                    <TableHead>{t("finance.amountPaid")}</TableHead>
                    <TableHead>{t("finance.balance")}</TableHead>
                    <TableHead>{t("finance.status")}</TableHead>
                    <TableHead className="w-10 text-end">
                      <span className="sr-only">{t("common.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages.map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell className="font-medium">
                        {t(`options.paymentStages.${stage.stageName}`)}
                      </TableCell>
                      <TableCell>{stage.percentage}%</TableCell>
                      <TableCell>{formatMoney(stage.amount, locale)}</TableCell>
                      <TableCell>{formatMoney(stage.amountPaid, locale)}</TableCell>
                      <TableCell>{formatMoney(stage.balance, locale)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[stage.status]}>
                          {t(`options.paymentStatuses.${stage.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(stage);
                            setDialogOpen(true);
                          }}
                        >
                          {t("finance.update")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-medium hover:bg-muted/30">
                    <TableCell colSpan={2}>{t("finance.totals")}</TableCell>
                    <TableCell>{formatMoney(totalAmount, locale)}</TableCell>
                    <TableCell>{formatMoney(totalPaid, locale)}</TableCell>
                    <TableCell>{formatMoney(totalBalance, locale)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </CollapsibleCard>
  );
}
