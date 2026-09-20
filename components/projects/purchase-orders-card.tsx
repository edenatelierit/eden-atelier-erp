"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { deletePurchaseOrder, savePurchaseOrder } from "@/actions/procurement";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { SupplierSelectField } from "@/components/suppliers/supplier-select";
import { RowActions } from "@/components/ui/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  emptyPurchaseOrderLine,
  purchaseOrderLineSchema,
  type PurchaseOrderLineValues,
} from "@/lib/validations/procurement";
import type { SupplierOption } from "@/lib/validations/supplier";

function lineTotal(qty: string, unitPrice: string) {
  const quantity = Number(qty);
  const price = Number(unitPrice);
  if (Number.isNaN(quantity) || Number.isNaN(price)) {
    return "—";
  }
  return (quantity * price).toFixed(2);
}

function PurchaseOrderPanel({
  projectId,
  open,
  onOpenChange,
  order,
  suppliers,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrderLineValues | null;
  suppliers: SupplierOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(order?.id);

  const form = useForm<PurchaseOrderLineValues>({
    resolver: zodResolver(purchaseOrderLineSchema),
    defaultValues: emptyPurchaseOrderLine,
  });

  const watched = form.watch(["qty", "unitPrice"]);

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(order ?? emptyPurchaseOrderLine);
  }, [open, order, form]);

  async function onSubmit(values: PurchaseOrderLineValues) {
    setServerError(null);
    const result = await savePurchaseOrder(projectId, values);
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
      title={isEditing ? t("procurement.editLine") : t("procurement.addLine")}
      description={t("procurement.purchaseOrdersHint")}
      className="mx-4 mb-4"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="purchase-order-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("procurement.saveOrders")
            )}
          </Button>
        </>
      }
    >
      <Form id="purchase-order-form" form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.item}>
                <FieldLabel htmlFor="po-item">{t("procurement.item")}</FieldLabel>
                <Input id="po-item" {...form.register("item")} />
                <FieldError errors={[form.formState.errors.item]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.description}>
                <FieldLabel htmlFor="po-description">
                  {t("procurement.descriptionCol")}
                </FieldLabel>
                <Input id="po-description" {...form.register("description")} />
                <FieldError errors={[form.formState.errors.description]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.specification}>
                <FieldLabel htmlFor="po-spec">{t("procurement.specification")}</FieldLabel>
                <Input id="po-spec" {...form.register("specification")} />
                <FieldError errors={[form.formState.errors.specification]} />
              </FormField>
              <SupplierSelectField
                control={form.control}
                name="supplierId"
                suppliers={suppliers}
                error={form.formState.errors.supplierId}
              />
              <FormField data-invalid={!!form.formState.errors.qty}>
                <FieldLabel htmlFor="po-qty">{t("procurement.qty")}</FieldLabel>
                <Input id="po-qty" type="number" min="1" step="1" {...form.register("qty")} />
                <FieldError errors={[form.formState.errors.qty]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.unit}>
                <FieldLabel htmlFor="po-unit">{t("procurement.unit")}</FieldLabel>
                <Input id="po-unit" {...form.register("unit")} />
                <FieldError errors={[form.formState.errors.unit]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.unitPrice}>
                <FieldLabel htmlFor="po-price">{t("procurement.unitPrice")}</FieldLabel>
                <Input
                  id="po-price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("unitPrice")}
                />
                <FieldError errors={[form.formState.errors.unitPrice]} />
              </FormField>
              <FormField>
                <FieldLabel>{t("procurement.total")}</FieldLabel>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted px-2.5 text-sm text-muted-foreground">
                  {lineTotal(watched[0] ?? "", watched[1] ?? "")}
                </div>
              </FormField>
              <FormField data-invalid={!!form.formState.errors.requiredDate}>
                <FieldLabel htmlFor="po-date">{t("procurement.requiredDate")}</FieldLabel>
                <Input id="po-date" type="date" {...form.register("requiredDate")} />
                <FieldError errors={[form.formState.errors.requiredDate]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.deliveryLocation}>
                <FieldLabel htmlFor="po-location">
                  {t("procurement.deliveryLocation")}
                </FieldLabel>
                <Input id="po-location" {...form.register("deliveryLocation")} />
                <FieldError errors={[form.formState.errors.deliveryLocation]} />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="po-remarks">{t("procurement.remarks")}</FieldLabel>
                <Input id="po-remarks" {...form.register("remarks")} />
              </FormField>
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

export function PurchaseOrdersCard({
  projectId,
  orders,
  suppliers,
}: {
  projectId: string;
  orders: PurchaseOrderLineValues[];
  suppliers: SupplierOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrderLineValues | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PurchaseOrderLineValues | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <CollapsibleCard
      title={t("procurement.purchaseOrders")}
      description={t("procurement.purchaseOrdersHint")}
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelected(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          {t("procurement.addLine")}
        </Button>
      }
    >
      <PurchaseOrderPanel
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selected}
        suppliers={suppliers}
      />
      <CardContent className="pt-4">
        {deleteError ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}
        {orders.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t("procurement.noOrders")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("procurement.poNumber")}</TableHead>
                  <TableHead>{t("procurement.item")}</TableHead>
                  <TableHead>{t("procurement.supplier")}</TableHead>
                  <TableHead>{t("procurement.qty")}</TableHead>
                  <TableHead>{t("procurement.total")}</TableHead>
                  <TableHead>{t("procurement.requiredDate")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id || order.poNumber}>
                    <TableCell className="font-medium">{order.poNumber}</TableCell>
                    <TableCell className="whitespace-normal">{order.item}</TableCell>
                    <TableCell>
                      {suppliers.find((item) => item.id === order.supplierId)?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {order.qty} {order.unit}
                    </TableCell>
                    <TableCell>{lineTotal(order.qty, order.unitPrice)}</TableCell>
                    <TableCell>{order.requiredDate}</TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => {
                          setSelected(order);
                          setDialogOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(order);
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
        title={t("procurement.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete?.id) return;
          setDeleting(true);
          const result = await deletePurchaseOrder(projectId, pendingDelete.id);
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
