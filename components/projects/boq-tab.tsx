"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { deleteBoqItem, saveBoqItem } from "@/actions/boq";
import { useI18n } from "@/components/locale-provider";
import type { BoqItemRow } from "@/components/projects/project-hub-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
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
import { unitOptionLabel } from "@/lib/master-data";
import { formatMoney } from "@/lib/money";
import {
  boqItemSchema,
  boqLineTotal,
  emptyBoqItemValues,
  type BoqItemValues,
} from "@/lib/validations/boq";
import type { UnitOption } from "@/lib/validations/category";

function BoqPanel({
  open,
  onOpenChange,
  projectId,
  item,
  units,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item: BoqItemRow | null;
  units: UnitOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<BoqItemValues>({
    resolver: zodResolver(boqItemSchema),
    defaultValues: emptyBoqItemValues,
  });
  const quantity = Number(useWatch({ control: form.control, name: "quantity" }) || 0);
  const materialCost = Number(useWatch({ control: form.control, name: "materialCost" }) || 0);
  const laborCost = Number(useWatch({ control: form.control, name: "laborCost" }) || 0);
  const otherCost = Number(useWatch({ control: form.control, name: "otherCost" }) || 0);
  const totalCost = boqLineTotal({ quantity, materialCost, laborCost, otherCost });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            itemCode: item.itemCode,
            description: item.description,
            material: item.material,
            unitId: item.unitId,
            quantity: String(item.quantity),
            materialCost: String(item.materialCost),
            laborCost: String(item.laborCost),
            otherCost: String(item.otherCost),
            sellingPrice: String(item.sellingPrice),
          }
        : emptyBoqItemValues
    );
  }, [open, item, form]);

  async function onSubmit(values: BoqItemValues) {
    setServerError(null);
    const result = await saveBoqItem(projectId, values);
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
      title={item ? t("boq.editItem") : t("boq.addItem")}
      description={t("boq.dialogHint")}
      className="mx-4 mb-4"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="boq-item-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </>
      }
    >
      <Form id="boq-item-form" form={form} onSubmit={onSubmit}>
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.itemCode}>
                <FieldLabel htmlFor="itemCode">{t("boq.itemCode")}</FieldLabel>
                <Input id="itemCode" {...form.register("itemCode")} />
                <FieldError errors={[form.formState.errors.itemCode]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.description}>
                <FieldLabel htmlFor="boqDescription">{t("boq.description")}</FieldLabel>
                <Input id="boqDescription" {...form.register("description")} />
                <FieldError errors={[form.formState.errors.description]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.material}>
                <FieldLabel htmlFor="boqMaterial">{t("boq.material")}</FieldLabel>
                <Input id="boqMaterial" {...form.register("material")} />
                <FieldError errors={[form.formState.errors.material]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.unitId}>
                <FieldLabel>{t("boq.unit")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("inventory.selectUnit")}>
                          {units.find((unit) => unit.id === field.value)
                            ? unitOptionLabel(
                                units.find((unit) => unit.id === field.value)!,
                                locale
                              )
                            : t("inventory.selectUnit")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unitOptionLabel(unit, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.unitId]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.quantity}>
                <FieldLabel htmlFor="boqQty">{t("boq.quantity")}</FieldLabel>
                <Input id="boqQty" type="number" step="0.001" {...form.register("quantity")} />
                <FieldError errors={[form.formState.errors.quantity]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.materialCost}>
                <FieldLabel htmlFor="materialCost">{t("boq.materialCost")}</FieldLabel>
                <Input id="materialCost" type="number" step="0.01" {...form.register("materialCost")} />
                <FieldError errors={[form.formState.errors.materialCost]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.laborCost}>
                <FieldLabel htmlFor="laborCost">{t("boq.laborCost")}</FieldLabel>
                <Input id="laborCost" type="number" step="0.01" {...form.register("laborCost")} />
                <FieldError errors={[form.formState.errors.laborCost]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.otherCost}>
                <FieldLabel htmlFor="otherCost">{t("boq.otherCost")}</FieldLabel>
                <Input id="otherCost" type="number" step="0.01" {...form.register("otherCost")} />
                <FieldError errors={[form.formState.errors.otherCost]} />
              </FormField>
              <FormField>
                <FieldLabel>{t("boq.totalCost")}</FieldLabel>
                <Input readOnly value={formatMoney(totalCost, locale)} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.sellingPrice}>
                <FieldLabel htmlFor="sellingPrice">{t("boq.sellingPrice")}</FieldLabel>
                <Input id="sellingPrice" type="number" step="0.01" {...form.register("sellingPrice")} />
                <FieldError errors={[form.formState.errors.sellingPrice]} />
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

export function BoqTab({
  projectId,
  items,
  units,
}: {
  projectId: string;
  items: BoqItemRow[];
  units: UnitOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BoqItemRow | null>(null);
  const [pending, setPending] = useState<BoqItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totals = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const sellingPrice = items.reduce((sum, item) => sum + item.sellingPrice, 0);
    const margin = sellingPrice === 0 ? 0 : ((sellingPrice - totalCost) / sellingPrice) * 100;
    return { totalCost, sellingPrice, margin };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t("boq.totalProjectCost")}</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">
              {formatMoney(totals.totalCost, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("boq.totalSellingPrice")}</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">
              {formatMoney(totals.sellingPrice, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("boq.grossMargin")}</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">
              {totals.margin.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t("boq.title")}</CardTitle>
            <CardDescription>{t("boq.subtitle")}</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            disabled={units.length === 0}
          >
            <Plus />
            {t("boq.addItem")}
          </Button>
        </CardHeader>
        <BoqPanel
          open={open}
          onOpenChange={setOpen}
          projectId={projectId}
          item={editing}
          units={units}
        />
        <CardContent className="pt-4">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("inventory.noMasterData")}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("boq.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t("boq.itemCode")}</TableHead>
                    <TableHead>{t("boq.description")}</TableHead>
                    <TableHead>{t("boq.material")}</TableHead>
                    <TableHead>{t("boq.unit")}</TableHead>
                    <TableHead className="text-end">{t("boq.quantity")}</TableHead>
                    <TableHead className="text-end">{t("boq.totalCost")}</TableHead>
                    <TableHead className="text-end">{t("boq.sellingPrice")}</TableHead>
                    <TableHead className="w-10 text-end">
                      <span className="sr-only">{t("common.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemCode}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.material}</TableCell>
                      <TableCell>{item.unitSymbol}</TableCell>
                      <TableCell className="text-end tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(item.totalCost, locale)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatMoney(item.sellingPrice, locale)}
                      </TableCell>
                      <TableCell className="text-end">
                        <RowActions
                          onEdit={() => {
                            setEditing(item);
                            setOpen(true);
                          }}
                          onDelete={() => setPending(item)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(pending)}
        onOpenChange={(openDialog) => {
          if (!openDialog) setPending(null);
        }}
        pending={deleting}
        onConfirm={async () => {
          if (!pending) return;
          setDeleting(true);
          await deleteBoqItem(projectId, pending.id);
          setDeleting(false);
          setPending(null);
          router.refresh();
        }}
      />
    </div>
  );
}
