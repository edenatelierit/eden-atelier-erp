"use client";

import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import type { ClientFormValues } from "@/lib/validations/client";

const variants = {
  NEW: "secondary",
  CONTACTED: "outline",
  CONVERTED: "default",
} as const;

export function ClientStatusBadge({
  status,
}: {
  status: ClientFormValues["status"];
}) {
  const { t } = useI18n();

  return (
    <Badge variant={variants[status]}>
      {t(`options.clientStatuses.${status}`)}
    </Badge>
  );
}
