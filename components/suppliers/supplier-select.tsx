"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { useI18n } from "@/components/locale-provider";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/ui/form-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupplierOption } from "@/lib/validations/supplier";

export function SupplierSelectField<T extends FieldValues>({
  control,
  name,
  suppliers,
  error,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  suppliers: SupplierOption[];
  error?: { message?: string };
}) {
  const { t } = useI18n();
  const disabled = suppliers.length === 0;

  return (
    <FormField data-invalid={!!error}>
      <FieldLabel>{t("approvals.supplier")}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected = suppliers.find((item) => item.id === field.value);
          return (
            <Select
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {disabled
                    ? t("suppliersPage.none")
                    : selected
                      ? selected.name
                      : t("suppliersPage.select")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {suppliers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />
      <FieldError errors={[error]} />
    </FormField>
  );
}
