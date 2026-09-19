export const PIPELINE_STEPS = [
  "materialIssued",
  "cutting",
  "cnc",
  "edgeBanding",
  "assembly",
  "finishing",
  "hardware",
  "stoneFabrication",
  "qc",
  "packing",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export type WorkOrderPipelineValues = Record<PipelineStep, boolean>;

export const emptyPipelineValues: WorkOrderPipelineValues = {
  materialIssued: false,
  cutting: false,
  cnc: false,
  edgeBanding: false,
  assembly: false,
  finishing: false,
  hardware: false,
  stoneFabrication: false,
  qc: false,
  packing: false,
};

export function isPipelineStep(value: string): value is PipelineStep {
  return (PIPELINE_STEPS as readonly string[]).includes(value);
}
