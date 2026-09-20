"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { deleteSupplier, saveSupplier } from "@/actions/supplier";
import { useI18n } from "@/components/locale-provider";
import { TableSearch } from "@/components/table-search";
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
import {
  SUPPLIER_CATEGORIES,
  emptySupplierValues,
  supplierFormSchema,
  type SupplierCategoryValue,
  type SupplierFormValues,
} from "@/lib/validations/supplier";

export type SupplierRecord = {
  id: string;
  name: string;
  category: SupplierCategoryValue;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  paymentTerms: string | null;
};

function SupplierPanel({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierRecord | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(supplier);
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: emptySupplierValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      supplier
        ? {
            id: supplier.id,
            name: supplier.name,
            category: supplier.category,
            contactPerson: supplier.contactPerson ?? "",
            phone: supplier.phone ?? "",
            email: supplier.email ?? "",
            paymentTerms: supplier.paymentTerms ?? "",
          }
        : emptySupplierValues
    );
  }, [open, supplier, form]);

  async function onSubmit(values: SupplierFormValues) {
    setServerError(null);
    const result = await saveSupplier(values);
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
      title={
        isEditing ? t("suppliersPage.editSupplier") : t("suppliersPage.addSupplier")
      }
      description={t("suppliersPage.subtitle")}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="supplier-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("suppliersPage.save")
            )}
          </Button>
        </>
      }
    >
      <Form id="supplier-form" form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="medium" data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="sup-name">{t("suppliersPage.name")}</FieldLabel>
                <Input id="sup-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.category}>
                <FieldLabel>{t("suppliersPage.category")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {t(`options.supplierCategories.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {SUPPLIER_CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.supplierCategories.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.category]} />
              </FormField>
              <FormField span="medium">
                <FieldLabel htmlFor="sup-contact">
                  {t("suppliersPage.contactPerson")}
                </FieldLabel>
                <Input id="sup-contact" {...form.register("contactPerson")} />
              </FormField>
              <FormField span="medium">
                <FieldLabel htmlFor="sup-phone">{t("suppliersPage.phone")}</FieldLabel>
                <Input id="sup-phone" type="tel" {...form.register("phone")} />
              </FormField>
              <FormField span="medium" data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="sup-email">{t("suppliersPage.email")}</FieldLabel>
                <Input id="sup-email" type="email" {...form.register("email")} />
                <FieldError errors={[form.formState.errors.email]} />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="sup-terms">
                  {t("suppliersPage.paymentTerms")}
                </FieldLabel>
                <Input id="sup-terms" {...form.register("paymentTerms")} />
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

export function SuppliersWorkspace({
  suppliers,
  query,
}: {
  suppliers: SupplierRecord[];
  query: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SupplierRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SupplierRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("suppliersPage.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("suppliersPage.subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus />
          {t("suppliersPage.addSupplier")}
        </Button>
      </div>

      <SupplierPanel open={open} onOpenChange={setOpen} supplier={selected} />

      <Suspense
        fallback={<div className="h-8 max-w-sm rounded-lg border border-input bg-background" />}
      >
        <TableSearch />
      </Suspense>

      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">
              {query ? t("search.noResults") : t("suppliersPage.emptyTitle")}
            </p>
            {query ? null : (
              <>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("suppliersPage.emptyCopy")}
                </p>
                <Button
                  onClick={() => {
                    setSelected(null);
                    setOpen(true);
                  }}
                >
                  <Plus />
                  {t("suppliersPage.addSupplier")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{t("suppliersPage.name")}</TableHead>
                <TableHead>{t("suppliersPage.category")}</TableHead>
                <TableHead>{t("suppliersPage.contactPerson")}</TableHead>
                <TableHead>{t("suppliersPage.phone")}</TableHead>
                <TableHead>{t("suppliersPage.email")}</TableHead>
                <TableHead>{t("suppliersPage.paymentTerms")}</TableHead>
                <TableHead className="w-10 text-end">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    {t(`options.supplierCategories.${supplier.category}`)}
                  </TableCell>
                  <TableCell>{supplier.contactPerson ?? "—"}</TableCell>
                  <TableCell>{supplier.phone ?? "—"}</TableCell>
                  <TableCell>{supplier.email ?? "—"}</TableCell>
                  <TableCell className="whitespace-normal">
                    {supplier.paymentTerms ?? "—"}
                  </TableCell>
                  <TableCell className="text-end">
                    <RowActions
                      onEdit={() => {
                        setSelected(supplier);
                        setOpen(true);
                      }}
                      onDelete={() => {
                        setDeleteError(null);
                        setPendingDelete(supplier);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(openDialog) => {
          if (!openDialog) setPendingDelete(null);
        }}
        title={t("suppliersPage.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteSupplier(pendingDelete.id);
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
