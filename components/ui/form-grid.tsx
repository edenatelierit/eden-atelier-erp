import type { ComponentProps } from "react";

import { Field } from "@/components/ui/field";
import { cn } from "cn";

/**
 * Dense wrapping form layout used across the app.
 * Cells keep a usable minimum width so phone/email are not crushed.
 * Short values (qty, codes, dates) stay one cell; contact text uses medium;
 * notes/remarks use wide; full only for a whole-row line.
 */
export function FormGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="form-grid"
      className={cn(
        "grid grid-cols-1 gap-3 [grid-template-columns:repeat(auto-fill,minmax(11rem,1fr))]",
        className
      )}
      {...props}
    />
  );
}

const fieldSpanClass = {
  /** qty, unit, price, dates, codes, status */
  compact: "min-w-0",
  /** phone, email, names, selects that need readable width */
  medium: "sm:col-span-2 min-w-0",
  /** remarks, comments, specification, locations */
  wide: "sm:col-span-2 lg:col-span-3 min-w-0",
  /** whole-row lines only */
  full: "col-span-full min-w-0",
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
