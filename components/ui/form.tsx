"use client";

import type { ReactNode } from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";

export function Form<T extends FieldValues>({
  form,
  children,
  onSubmit,
  className,
}: {
  form: UseFormReturn<T>;
  children: ReactNode;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
}) {
  return (
    <FormProvider {...form}>
      <form className={className} onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
