import { z } from "zod";

import {
  DRAWING_APPROVAL_STATUSES,
  MATERIAL_APPROVAL_STATUSES,
} from "@/lib/approval-options";

const materialStatusValues = MATERIAL_APPROVAL_STATUSES.map(
  (item) => item.value
) as [
  (typeof MATERIAL_APPROVAL_STATUSES)[number]["value"],
  ...(typeof MATERIAL_APPROVAL_STATUSES)[number]["value"][],
];

const drawingStatusValues = DRAWING_APPROVAL_STATUSES.map(
  (item) => item.value
) as [
  (typeof DRAWING_APPROVAL_STATUSES)[number]["value"],
  ...(typeof DRAWING_APPROVAL_STATUSES)[number]["value"][],
];

function commentsRequiredWhenNotApproved(
  data: { status: string; comments?: string },
  ctx: z.RefinementCtx
) {
  if (data.status !== "APPROVED" && !data.comments?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["comments"],
      message: "Add comments for this status.",
    });
  }
}

export const materialApprovalSchema = z
  .object({
    itemLocation: z.string().trim().min(2, "Item location is required."),
    material: z.string().trim().min(2, "Material is required."),
    supplierId: z.string().trim().min(1, "Select a supplier."),
    productCode: z.string().trim().min(1, "Product code is required."),
    thickness: z.string().trim().min(1, "Thickness is required."),
    finish: z.string().trim().min(1, "Finish is required."),
    sampleAttached: z.boolean(),
    status: z.enum(materialStatusValues),
    comments: z.string().optional(),
  })
  .superRefine(commentsRequiredWhenNotApproved);

export const drawingApprovalSchema = z
  .object({
    drawingNo: z.string().trim().min(1, "Drawing number is required."),
    title: z.string().trim().min(2, "Title is required."),
    revision: z.string().trim().min(1, "Revision is required."),
    status: z.enum(drawingStatusValues),
    comments: z.string().optional(),
  })
  .superRefine(commentsRequiredWhenNotApproved);

export type MaterialApprovalValues = z.infer<typeof materialApprovalSchema>;
export type DrawingApprovalValues = z.infer<typeof drawingApprovalSchema>;

export const emptyMaterialApprovalValues: MaterialApprovalValues = {
  itemLocation: "",
  material: "",
  supplierId: "",
  productCode: "",
  thickness: "",
  finish: "",
  sampleAttached: false,
  status: "APPROVED",
  comments: "",
};

export const emptyDrawingApprovalValues: DrawingApprovalValues = {
  drawingNo: "",
  title: "",
  revision: "",
  status: "APPROVED",
  comments: "",
};
