import type { AttachmentEntityType } from "@prisma/client";

export type PhotoItem = {
  id: string;
  url: string;
};

export const UPLOAD_ENTITY_TYPES = [
  "SITE_SURVEY",
  "MATERIAL_APPROVAL",
  "SERVICE_REQUEST",
  "HANDOVER_CERTIFICATE",
] as const satisfies AttachmentEntityType[];

export type UploadEntityType = (typeof UPLOAD_ENTITY_TYPES)[number];

export function asUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function isUploadEntityType(value: string): value is UploadEntityType {
  return (UPLOAD_ENTITY_TYPES as readonly string[]).includes(value);
}
