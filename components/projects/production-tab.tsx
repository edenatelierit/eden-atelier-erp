"use client";

import { CuttingListForm } from "@/components/projects/cutting-list-form";
import { WorkOrderPipelineCard } from "@/components/projects/work-order-pipeline";
import type { CuttingListPartValues } from "@/lib/validations/production";
import type { WorkOrderPipelineValues } from "@/lib/validations/pipeline";

export function ProductionTab({
  projectId,
  pipeline,
  cuttingList,
}: {
  projectId: string;
  pipeline: WorkOrderPipelineValues;
  cuttingList: CuttingListPartValues[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <WorkOrderPipelineCard projectId={projectId} initialValues={pipeline} />
      <CuttingListForm projectId={projectId} initialParts={cuttingList} />
    </div>
  );
}
