import type { ComponentProps } from "react";

import { Field } from "@/components/ui/field";
import { cn } from "cn";

/**
 * Dense wrapping form layout used across the app.
 * Short values (qty, codes, dates) stay one cell; notes span two.
 */
export function FormGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="form-grid"
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6", className)}
      {...props}
    />
  );
}

const fieldSpanClass = {
  compact: "col-span-1",
  wide: "sm:col-span-2 xl:col-span-2",
  full: "sm:col-span-2 xl:col-span-6",
} as const;

export function FormField({
  span = "compact",
  className,
  ...props
}: ComponentProps<typeof Field> & {
  span?: keyof typeof fieldSpanClass;
}) {
  return (
    <Field className={cn(fieldSpanClass[span], className)} {...props} />
  );
}
