"use client";

import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";

const variants: Record<string, "default" | "secondary" | "outline"> = {
  LEAD: "secondary",
  SURVEY: "outline",
  DESIGN: "outline",
  PRODUCTION: "default",
  LOGISTICS: "outline",
  INSTALLATION: "default",
  ON_HOLD: "secondary",
  COMPLETED: "secondary",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();

  return (
    <Badge variant={variants[status] ?? "outline"}>
      {t(`options.projectStatuses.${status}`)}
    </Badge>
  );
}
