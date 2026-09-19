"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { deleteInventoryItem, saveInventoryItem } from "@/actions/inventory";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { masterLabel, unitOptionLabel } from "@/lib/master-data";
import { formatMoney } from "@/lib/money";
import {
  emptyInventoryItem,
  inventoryItemSchema,
  type InventoryItemValues,
} from "@/lib/validations/inventory";
import type { CategoryOption, UnitOption } from "@/lib/validations/category";
import type { SupplierOption } from "@/lib/validations/supplier";

export type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryNameEn: string;
  categoryNameAr: string;
  categoryCode: string;
  unitId: string;
  unitSymbol: string;
  unitNameEn: string;
  unitNameAr: string;
  supplierId: string | null;
  supplierName: string | null;
  costPrice: number;
  sellingPrice: number | null;
  location: string | null;
  quantityInStock: number;
  minimumThreshold: number;
};

function ItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  units,
  suppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryRow | null;
  categories: CategoryOption[];
  units: UnitOption[];
  suppliers: SupplierOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<InventoryItemValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: emptyInventoryItem,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            sku: item.sku,
            name: item.name,
            categoryId: item.categoryId,
            unitId: item.unitId,
            supplierId: item.supplierId ?? "",
            costPrice: String(item.costPrice),
            sellingPrice:
              item.sellingPrice === null || item.sellingPrice === undefined
                ? ""
                : String(item.sellingPrice),
            location: item.location ?? "",
            quantityInStock: String(item.quantityInStock),
            minimumThreshold: String(item.minimumThreshold),
          }
        : {
            ...emptyInventoryItem,
            categoryId: categories[0]?.id ?? "",
            unitId: units[0]?.id ?? "",
          }
    );
  }, [open, item, form, categories, units]);

  async function onSubmit(values: InventoryItemValues) {
    setServerError(null);
    const result = await saveInventoryItem(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  const missingLookups = categories.length === 0 || units.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? t("inventory.editItem") : t("inventory.addItem")}
          </DialogTitle>
          <DialogDescription>{t("inventory.subtitle")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.sku}>
                <FieldLabel htmlFor="inv-sku">{t("inventory.sku")}</FieldLabel>
                <Input
                  id="inv-sku"
                  placeholder={t("inventory.skuHint")}
                  {...form.register("sku")}
                />
                <FieldError errors={[form.formState.errors.sku]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="inv-name">{t("inventory.name")}</FieldLabel>
                <Input id="inv-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.categoryId}>
                <FieldLabel>{t("inventory.category")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => {
                    const selected = categories.find((row) => row.id === field.value);
                    return (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected
                              ? masterLabel(selected, locale)
                              : t("inventory.selectCategory")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {categories.map((row) => (
                            <SelectItem key={row.id} value={row.id}>
                              {masterLabel(row, locale)} · {row.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <FieldError errors={[form.formState.errors.categoryId]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.unitId}>
                <FieldLabel>{t("inventory.unit")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="unitId"
                  render={({ field }) => {
                    const selected = units.find((row) => row.id === field.value);
                    return (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected
                              ? unitOptionLabel(selected, locale)
                              : t("inventory.selectUnit")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {units.map((row) => (
                            <SelectItem key={row.id} value={row.id}>
                              {unitOptionLabel(row, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <FieldError errors={[form.formState.errors.unitId]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.supplierId}>
                <FieldLabel>{t("inventory.supplier")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => {
                    const selected = suppliers.find((row) => row.id === field.value);
                    return (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected?.name ?? t("inventory.noSupplier")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="none">
                            {t("inventory.noSupplier")}
                          </SelectItem>
                          {suppliers.map((row) => (
                            <SelectItem key={row.id} value={row.id}>
                              {row.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.costPrice}>
                <FieldLabel htmlFor="inv-cost">{t("inventory.costPrice")}</FieldLabel>
                <Input
                  id="inv-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("costPrice")}
                />
                <FieldError errors={[form.formState.errors.costPrice]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.sellingPrice}>
                <FieldLabel htmlFor="inv-sell">{t("inventory.sellingPrice")}</FieldLabel>
                <Input
                  id="inv-sell"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("sellingPrice")}
                />
                <FieldError errors={[form.formState.errors.sellingPrice]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.quantityInStock}>
                <FieldLabel htmlFor="inv-qty">{t("inventory.qty")}</FieldLabel>
                <Input
                  id="inv-qty"
                  type="number"
                  min="0"
                  step="0.001"
                  {...form.register("quantityInStock")}
                />
                <FieldError errors={[form.formState.errors.quantityInStock]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.minimumThreshold}>
                <FieldLabel htmlFor="inv-min">{t("inventory.threshold")}</FieldLabel>
                <Input
                  id="inv-min"
                  type="number"
                  min="0"
                  step="0.001"
                  {...form.register("minimumThreshold")}
                />
                <FieldError errors={[form.formState.errors.minimumThreshold]} />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="inv-loc">{t("inventory.location")}</FieldLabel>
                <Input id="inv-loc" {...form.register("location")} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {missingLookups ? (
            <p className="text-sm text-destructive" role="alert">
              {t("inventory.noMasterData")}
            </p>
          ) : null}
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || missingLookups}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("inventory.save")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryWorkspace({
  items,
  categories,
  units,
  suppliers,
}: {
  items: InventoryRow[];
  categories: CategoryOption[];
  units: UnitOption[];
  suppliers: SupplierOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InventoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("inventory.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("inventory.subtitle")}</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          <Plus />
          {t("inventory.addItem")}
        </Button>
      </div>

      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">{t("inventory.emptyTitle")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("inventory.emptyCopy")}
            </p>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              <Plus />
              {t("inventory.addItem")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("inventory.sku")}</TableHead>
                <TableHead>{t("inventory.name")}</TableHead>
                <TableHead>{t("inventory.category")}</TableHead>
                <TableHead>{t("inventory.unit")}</TableHead>
                <TableHead>{t("inventory.supplier")}</TableHead>
                <TableHead>{t("inventory.costPrice")}</TableHead>
                <TableHead>{t("inventory.qty")}</TableHead>
                <TableHead className="w-10 text-end">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const low = item.quantityInStock < item.minimumThreshold;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {masterLabel(
                          { nameEn: item.categoryNameEn, nameAr: item.categoryNameAr },
                          locale
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.unitSymbol}</TableCell>
                    <TableCell>{item.supplierName ?? "—"}</TableCell>
                    <TableCell>{formatMoney(item.costPrice, locale, "USD")}</TableCell>
                    <TableCell
                      className={low ? "font-medium text-destructive" : undefined}
                    >
                      {item.quantityInStock.toLocaleString(
                        locale === "ar" ? "ar" : "en-US",
                        { maximumFractionDigits: 3 }
                      )}{" "}
                      {item.unitSymbol}
                      {low ? (
                        <span className="ms-2 text-xs">{t("inventory.lowStock")}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => {
                          setSelected(item);
                          setOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(item);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        item={selected}
        categories={categories}
        units={units}
        suppliers={suppliers}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(openDialog) => {
          if (!openDialog) setPendingDelete(null);
        }}
        title={t("inventory.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteInventoryItem(pendingDelete.id);
          setDeleting(false);
          if (result.error) {
            setDeleteError(result.error);
            return;
          }
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
