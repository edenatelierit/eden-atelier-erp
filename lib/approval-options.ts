export const MATERIAL_APPROVAL_STATUSES = [
  { value: "APPROVED", label: "Approved" },
  { value: "APPROVED_WITH_COMMENTS", label: "Approved with comments" },
  { value: "REVISE_RESUBMIT", label: "Revise & Resubmit" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export const DRAWING_APPROVAL_STATUSES = [
  { value: "APPROVED", label: "Approved" },
  { value: "APPROVED_WITH_COMMENTS", label: "Approved with comments" },
  { value: "REVISE_RESUBMIT", label: "Revise & Resubmit" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export type MaterialApprovalStatusValue =
  (typeof MATERIAL_APPROVAL_STATUSES)[number]["value"];
export type DrawingApprovalStatusValue =
  (typeof DRAWING_APPROVAL_STATUSES)[number]["value"];

export function materialApprovalStatusLabel(status: string) {
  return (
    MATERIAL_APPROVAL_STATUSES.find((item) => item.value === status)?.label ??
    status
  );
}

export function drawingApprovalStatusLabel(status: string) {
  return (
    DRAWING_APPROVAL_STATUSES.find((item) => item.value === status)?.label ??
    status
  );
}
