"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createReceivingNote } from "@/actions/procurement";
import { useI18n } from "@/components/locale-provider";
import type { ReceivingNoteRow } from "@/components/projects/project-hub-types";
import { PurchaseOrdersCard } from "@/components/projects/purchase-orders-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
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
  emptyReceivingNoteValues,
  receivingNoteSchema,
  type PurchaseOrderLineValues,
  type ReceivingNoteValues,
} from "@/lib/validations/procurement";
import type { SupplierOption } from "@/lib/validations/supplier";

const RECEIVING_CONDITIONS = ["GOOD", "PARTIAL", "DAMAGED"] as const;

function ReceivingCard({
  projectId,
  orders,
  receipts,
}: {
  projectId: string;
  orders: PurchaseOrderLineValues[];
  receipts: ReceivingNoteRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedOrders = useMemo(
    () => orders.filter((order) => Boolean(order.id)),
    [orders]
  );

  const form = useForm<ReceivingNoteValues>({
    resolver: zodResolver(receivingNoteSchema),
    defaultValues: {
      ...emptyReceivingNoteValues,
      purchaseOrderId: savedOrders[0]?.id ?? "",
    },
  });

  async function onSubmit(values: ReceivingNoteValues) {
    setServerError(null);
    setSaved(false);
    const result = await createReceivingNote(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset({
      ...emptyReceivingNoteValues,
      purchaseOrderId: values.purchaseOrderId,
    });
    setSaved(true);
    router.refresh();
  }

  return (
    <CollapsibleCard
      title={t("procurement.receiving")}
      description={t("procurement.receivingHint")}
    >
      {savedOrders.length === 0 ? (
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">
            {t("procurement.noOrders")}
          </p>
        </CardContent>
      ) : (
        <Form form={form} onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-4">
            <FieldGroup>
              <FormGrid>
                <FormField span="wide">
                  <FieldLabel>{t("procurement.selectPo")}</FieldLabel>
                  <Controller
                    control={form.control}
                    name="purchaseOrderId"
                    render={({ field }) => (
                      <Select
                        value={field.value || null}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("procurement.selectPo")}>
                            {savedOrders.find((order) => order.id === field.value)
                              ? `${savedOrders.find((order) => order.id === field.value)?.poNumber} · ${savedOrders.find((order) => order.id === field.value)?.item}`
                              : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {savedOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id ?? ""}>
                              {order.poNumber} · {order.item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[form.formState.errors.purchaseOrderId]} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="receivedQty">
                    {t("procurement.receivedQty")}
                  </FieldLabel>
                  <Input
                    id="receivedQty"
                    type="number"
                    min="1"
                    step="1"
                    {...form.register("receivedQty")}
                  />
                  <FieldError errors={[form.formState.errors.receivedQty]} />
                </FormField>
                <FormField>
                  <FieldLabel>{t("procurement.condition")}</FieldLabel>
                  <Controller
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {t(`options.receivingConditions.${field.value}`)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {RECEIVING_CONDITIONS.map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`options.receivingConditions.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="checkedBy">
                    {t("procurement.checkedBy")}
                  </FieldLabel>
                  <Input id="checkedBy" {...form.register("checkedBy")} />
                  <FieldError errors={[form.formState.errors.checkedBy]} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="receivingDate">
                    {t("procurement.date")}
                  </FieldLabel>
                  <Input
                    id="receivingDate"
                    type="date"
                    {...form.register("date")}
                  />
                  <FieldError errors={[form.formState.errors.date]} />
                </FormField>
                <FormField span="wide">
                  <FieldLabel htmlFor="shortageDamage">
                    {t("procurement.shortageDamage")}
                  </FieldLabel>
                  <Input
                    id="shortageDamage"
                    {...form.register("shortageDamage")}
                  />
                  <FieldError errors={[form.formState.errors.shortageDamage]} />
                </FormField>
              </FormGrid>
            </FieldGroup>
            {serverError ? (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}
            {saved ? (
              <p className="text-sm text-muted-foreground">
                {t("procurement.receiptSaved")}
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
                t("procurement.logReceipt")
              )}
            </Button>
          </CardFooter>
        </Form>
      )}
      {receipts.length > 0 ? (
        <CardFooter className="flex-col items-stretch gap-3 border-t">
          <p className="text-sm font-medium">{t("procurement.loggedReceipts")}</p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {receipts.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="font-medium">
                  {item.poNumber} · {item.receivedQty}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`options.receivingConditions.${item.condition}`)} ·{" "}
                  {item.date} · {item.checkedBy}
                </p>
                <p className="mt-2 text-sm">{item.shortageDamage}</p>
              </li>
            ))}
          </ul>
        </CardFooter>
      ) : null}
    </CollapsibleCard>
  );
}

export function ProcurementTab({
  projectId,
  orders,
  receipts,
  suppliers,
}: {
  projectId: string;
  orders: PurchaseOrderLineValues[];
  receipts: ReceivingNoteRow[];
  suppliers: SupplierOption[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <PurchaseOrdersCard
        projectId={projectId}
        orders={orders}
        suppliers={suppliers}
      />
      <ReceivingCard
        projectId={projectId}
        orders={orders}
        receipts={receipts}
      />
    </div>
  );
}
