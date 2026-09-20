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
    id: z.string().optional(),
    itemLocation: z.string().trim().min(2, "Item location is required."),
    material: z.string().trim().min(2, "Material is required."),
    supplierId: z.string().trim().min(1, "Select a supplier."),
    productCode: z.string().trim().min(1, "Product code is required."),
    thickness: z.string().trim().optional(),
    finish: z.string().trim().optional(),
    hasPhysicalSample: z.boolean(),
    hasPhotograph: z.boolean(),
    hasTechnicalData: z.boolean(),
    status: z.enum(materialStatusValues),
    comments: z.string().optional(),
  })
  .superRefine(commentsRequiredWhenNotApproved);

export const drawingApprovalSchema = z
  .object({
    id: z.string().optional(),
    drawingNumber: z.string().trim().min(1, "Drawing number is required."),
    title: z.string().trim().min(2, "Title is required."),
    revision: z.string().trim().min(1, "Revision is required."),
    fileUrl: z.string().trim().optional(),
    status: z.enum(drawingStatusValues),
    comments: z.string().optional(),
  })
  .superRefine(commentsRequiredWhenNotApproved);

export type MaterialApprovalValues = z.infer<typeof materialApprovalSchema>;
export type DrawingApprovalValues = z.infer<typeof drawingApprovalSchema>;

export const emptyMaterialApprovalValues: MaterialApprovalValues = {
  id: "",
  itemLocation: "",
  material: "",
  supplierId: "",
  productCode: "",
  thickness: "",
  finish: "",
  hasPhysicalSample: false,
  hasPhotograph: false,
  hasTechnicalData: false,
  status: "APPROVED",
  comments: "",
};

export const emptyDrawingApprovalValues: DrawingApprovalValues = {
  id: "",
  drawingNumber: "",
  title: "",
  revision: "",
  fileUrl: "",
  status: "APPROVED",
  comments: "",
};
