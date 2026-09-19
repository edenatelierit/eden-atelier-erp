import { z } from "zod";

export const QC_CHECKS = [
  "dimensionsMatch",
  "correctMaterial",
  "correctFinishColor",
  "grainVeinDirectionCorrect",
  "edgesProperlyFinished",
  "jointsClean",
  "hardwareCorrect",
  "doorsDrawersAligned",
  "noScratchesDamage",
  "stoneCutoutsCorrect",
  "stoneEdgeProfileAcceptable",
] as const;

export type QcCheckField = (typeof QC_CHECKS)[number];

export const qualityControlSchema = z.object({
  inspector: z.string().trim().min(1, "Inspector is required."),
  workOrder: z.string().trim().min(1, "Work order is required."),
  unitArea: z.string().trim().min(1, "Unit / area is required."),
  dimensionsMatch: z.boolean(),
  correctMaterial: z.boolean(),
  correctFinishColor: z.boolean(),
  grainVeinDirectionCorrect: z.boolean(),
  edgesProperlyFinished: z.boolean(),
  jointsClean: z.boolean(),
  hardwareCorrect: z.boolean(),
  doorsDrawersAligned: z.boolean(),
  noScratchesDamage: z.boolean(),
  stoneCutoutsCorrect: z.boolean(),
  stoneEdgeProfileAcceptable: z.boolean(),
});

export const deliveryNoteSchema = z.object({
  deliveryDateTime: z.string().trim().min(1, "Delivery date and time are required."),
  vehicleDriver: z.string().trim().min(1, "Vehicle / driver is required."),
  itemsDelivered: z.string().trim().min(1, "Items delivered are required."),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required.")
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      "Quantity must be a whole number."
    ),
  conditionRemarks: z.string().optional(),
});

export type QualityControlValues = z.infer<typeof qualityControlSchema>;
export type DeliveryNoteValues = z.infer<typeof deliveryNoteSchema>;

export const emptyQualityControlValues: QualityControlValues = {
  inspector: "",
  workOrder: "",
  unitArea: "",
  dimensionsMatch: false,
  correctMaterial: false,
  correctFinishColor: false,
  grainVeinDirectionCorrect: false,
  edgesProperlyFinished: false,
  jointsClean: false,
  hardwareCorrect: false,
  doorsDrawersAligned: false,
  noScratchesDamage: false,
  stoneCutoutsCorrect: false,
  stoneEdgeProfileAcceptable: false,
};

export const emptyDeliveryNoteValues: DeliveryNoteValues = {
  deliveryDateTime: "",
  vehicleDriver: "",
  itemsDelivered: "",
  quantity: "1",
  conditionRemarks: "",
};
