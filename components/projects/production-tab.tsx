"use client";

import { CuttingListForm } from "@/components/projects/cutting-list-form";
import { WorkOrderPipelineCard } from "@/components/projects/work-order-pipeline";
import { useI18n } from "@/components/locale-provider";
import type { CuttingListPartValues } from "@/lib/validations/production";
import type { WorkOrderPipelineValues } from "@/lib/validations/pipeline";

export function ProductionTab({
  projectId,
  pipeline,
  cuttingList,
  hasApprovedShopDrawing,
}: {
  projectId: string;
  pipeline: WorkOrderPipelineValues;
  cuttingList: CuttingListPartValues[];
  hasApprovedShopDrawing: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4">
      {hasApprovedShopDrawing ? null : (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {t("production.needsApprovedDrawings")}
        </div>
      )}
      <WorkOrderPipelineCard projectId={projectId} initialValues={pipeline} />
      <CuttingListForm projectId={projectId} initialParts={cuttingList} />
    </div>
  );
}
