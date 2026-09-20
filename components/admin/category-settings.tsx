"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  deleteCategory,
  deleteUnit,
  saveCategory,
  saveUnit,
  seedMasterDefaults,
} from "@/actions/category";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { RowActions } from "@/components/ui/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  categoryFormSchema,
  emptyCategoryValues,
  emptyUnitValues,
  unitFormSchema,
  type CategoryFormValues,
  type CategoryOption,
  type CategoryTypeValue,
  type UnitFormValues,
  type UnitOption,
} from "@/lib/validations/category";

function CategoryPanel({
  open,
  onOpenChange,
  type,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryTypeValue;
  item: CategoryOption | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { ...emptyCategoryValues, type },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            type: item.type,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            code: item.code,
          }
        : { ...emptyCategoryValues, type }
    );
  }, [open, item, type, form]);

  async function onSubmit(values: CategoryFormValues) {
    setServerError(null);
    const result = await saveCategory({ ...values, type });
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
      title={item ? t("admin.editCategory") : t("admin.addCategory")}
      description={t("admin.categoryHint")}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="category-form"
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
      <Form id="category-form" form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="medium" data-invalid={!!form.formState.errors.nameEn}>
                <FieldLabel htmlFor="cat-en">{t("admin.nameEn")}</FieldLabel>
                <Input id="cat-en" {...form.register("nameEn")} />
                <FieldError errors={[form.formState.errors.nameEn]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.nameAr}>
                <FieldLabel htmlFor="cat-ar">{t("admin.nameAr")}</FieldLabel>
                <Input id="cat-ar" dir="rtl" {...form.register("nameAr")} />
                <FieldError errors={[form.formState.errors.nameAr]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.code}>
                <FieldLabel htmlFor="cat-code">{t("admin.code")}</FieldLabel>
                <Input id="cat-code" className="uppercase" {...form.register("code")} />
                <FieldError errors={[form.formState.errors.code]} />
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

function UnitPanel({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UnitOption | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: emptyUnitValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      item
        ? {
            id: item.id,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            symbol: item.symbol,
          }
        : emptyUnitValues
    );
  }, [open, item, form]);

  async function onSubmit(values: UnitFormValues) {
    setServerError(null);
    const result = await saveUnit(values);
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
      title={item ? t("admin.editUnit") : t("admin.addUnit")}
      description={t("admin.unitHint")}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="unit-form"
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
      <Form id="unit-form" form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="medium" data-invalid={!!form.formState.errors.nameEn}>
                <FieldLabel htmlFor="unit-en">{t("admin.nameEn")}</FieldLabel>
                <Input id="unit-en" {...form.register("nameEn")} />
                <FieldError errors={[form.formState.errors.nameEn]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.nameAr}>
                <FieldLabel htmlFor="unit-ar">{t("admin.nameAr")}</FieldLabel>
                <Input id="unit-ar" dir="rtl" {...form.register("nameAr")} />
                <FieldError errors={[form.formState.errors.nameAr]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.symbol}>
                <FieldLabel htmlFor="unit-symbol">{t("admin.symbol")}</FieldLabel>
                <Input id="unit-symbol" {...form.register("symbol")} />
                <FieldError errors={[form.formState.errors.symbol]} />
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

function CategoryTable({
  items,
  onEdit,
  onDelete,
}: {
  items: CategoryOption[];
  onEdit: (item: CategoryOption) => void;
  onDelete: (item: CategoryOption) => void;
}) {
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-sm text-muted-foreground">{t("admin.emptyCategories")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t("admin.nameEn")}</TableHead>
            <TableHead>{t("admin.nameAr")}</TableHead>
            <TableHead>{t("admin.code")}</TableHead>
            <TableHead className="w-10 text-end">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  {item.nameEn}
                  {item.isSystem ? (
                    <Badge variant="outline">{t("admin.system")}</Badge>
                  ) : null}
                </span>
              </TableCell>
              <TableCell dir="rtl">{item.nameAr}</TableCell>
              <TableCell>{item.code}</TableCell>
              <TableCell className="text-end">
                {item.isSystem ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("common.edit")}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil />
                  </Button>
                ) : (
                  <RowActions
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UnitTable({
  items,
  onEdit,
  onDelete,
}: {
  items: UnitOption[];
  onEdit: (item: UnitOption) => void;
  onDelete: (item: UnitOption) => void;
}) {
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-sm text-muted-foreground">{t("admin.emptyUnits")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t("admin.nameEn")}</TableHead>
            <TableHead>{t("admin.nameAr")}</TableHead>
            <TableHead>{t("admin.symbol")}</TableHead>
            <TableHead className="w-10 text-end">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  {item.nameEn}
                  {item.isSystem ? (
                    <Badge variant="outline">{t("admin.system")}</Badge>
                  ) : null}
                </span>
              </TableCell>
              <TableCell dir="rtl">{item.nameAr}</TableCell>
              <TableCell>{item.symbol}</TableCell>
              <TableCell className="text-end">
                {item.isSystem ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("common.edit")}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil />
                  </Button>
                ) : (
                  <RowActions
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CategorySettings({
  inventoryCategories,
  expenseCategories,
  incomeCategories,
  units,
}: {
  inventoryCategories: CategoryOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  units: UnitOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<CategoryTypeValue>("INVENTORY");
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [pendingCategory, setPendingCategory] = useState<CategoryOption | null>(null);
  const [pendingUnit, setPendingUnit] = useState<UnitOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  function addCategory(type: CategoryTypeValue) {
    setCategoryType(type);
    setSelectedCategory(null);
    setCategoryOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("nav.admin")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("admin.categoriesTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("admin.categoriesSubtitle")}
        </p>
        <Button
          variant="outline"
          className="mt-2"
          disabled={seeding}
          onClick={async () => {
            setDeleteError(null);
            setSeeding(true);
            const result = await seedMasterDefaults();
            setSeeding(false);
            if (result.error) {
              setDeleteError(result.error);
              return;
            }
            router.refresh();
          }}
        >
          {seeding ? <Loader2 className="animate-spin" /> : null}
          {t("admin.loadDefaults")}
        </Button>
      </div>

      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      <CategoryPanel
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        type={categoryType}
        item={selectedCategory}
      />
      <UnitPanel open={unitOpen} onOpenChange={setUnitOpen} item={selectedUnit} />

      <Tabs defaultValue="inventory" className="gap-5">
        <TabsList variant="line" className="h-auto justify-start">
          <TabsTrigger value="inventory">{t("admin.inventoryCategories")}</TabsTrigger>
          <TabsTrigger value="expense">{t("admin.expenseCategories")}</TabsTrigger>
          <TabsTrigger value="income">{t("admin.incomeCategories")}</TabsTrigger>
          <TabsTrigger value="units">{t("admin.unitsOfMeasure")}</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => addCategory("INVENTORY")}>
              <Plus />
              {t("admin.addCategory")}
            </Button>
          </div>
          <CategoryTable
            items={inventoryCategories}
            onEdit={(item) => {
              setCategoryType("INVENTORY");
              setSelectedCategory(item);
              setCategoryOpen(true);
            }}
            onDelete={(item) => {
              setDeleteError(null);
              setPendingCategory(item);
            }}
          />
        </TabsContent>

        <TabsContent value="expense" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => addCategory("EXPENSE")}>
              <Plus />
              {t("admin.addCategory")}
            </Button>
          </div>
          <CategoryTable
            items={expenseCategories}
            onEdit={(item) => {
              setCategoryType("EXPENSE");
              setSelectedCategory(item);
              setCategoryOpen(true);
            }}
            onDelete={(item) => {
              setDeleteError(null);
              setPendingCategory(item);
            }}
          />
        </TabsContent>

        <TabsContent value="income" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => addCategory("INCOME")}>
              <Plus />
              {t("admin.addCategory")}
            </Button>
          </div>
          <CategoryTable
            items={incomeCategories}
            onEdit={(item) => {
              setCategoryType("INCOME");
              setSelectedCategory(item);
              setCategoryOpen(true);
            }}
            onDelete={(item) => {
              setDeleteError(null);
              setPendingCategory(item);
            }}
          />
        </TabsContent>

        <TabsContent value="units" className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedUnit(null);
                setUnitOpen(true);
              }}
            >
              <Plus />
              {t("admin.addUnit")}
            </Button>
          </div>
          <UnitTable
            items={units}
            onEdit={(item) => {
              setSelectedUnit(item);
              setUnitOpen(true);
            }}
            onDelete={(item) => {
              setDeleteError(null);
              setPendingUnit(item);
            }}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDeleteDialog
        open={Boolean(pendingCategory || pendingUnit)}
        onOpenChange={(openDialog) => {
          if (!openDialog) {
            setPendingCategory(null);
            setPendingUnit(null);
          }
        }}
        title={
          pendingUnit ? t("admin.deleteUnitTitle") : t("admin.deleteCategoryTitle")
        }
        pending={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const result = pendingUnit
            ? await deleteUnit(pendingUnit.id)
            : pendingCategory
              ? await deleteCategory(pendingCategory.id)
              : { error: "Nothing to delete." };
          setDeleting(false);
          if (result.error) {
            setDeleteError(result.error);
            return;
          }
          setPendingCategory(null);
          setPendingUnit(null);
          router.refresh();
        }}
      />
    </div>
  );
}
