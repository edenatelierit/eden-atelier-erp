"use client";

import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";

const variants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  APPROVED: "default",
  APPROVED_WITH_COMMENTS: "outline",
  REVISE_RESUBMIT: "secondary",
  REVISE: "secondary",
  REJECTED: "destructive",
};

export function ApprovalStatusBadge({
  status,
}: {
  status: string;
  kind?: "material" | "drawing";
}) {
  const { t } = useI18n();

  return (
    <Badge variant={variants[status] ?? "outline"}>
      {t(`options.approvalStatuses.${status}`)}
    </Badge>
  );
}
