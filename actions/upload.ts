"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { AttachmentEntityType, Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/auth-guard";
import {
  asUrlList,
  isUploadEntityType,
  type UploadEntityType,
} from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { revalidateWorkspace } from "@/lib/revalidate";
import { getR2Client, r2BucketName, r2PublicUrl } from "@/lib/s3";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const IMAGE_UPLOADER_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

export async function uploadCloudImage(formData: FormData) {
  try {
    await requireSession();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a file to upload." };
    }
    if (file.size > MAX_BYTES) {
      return { error: "File must be 8 MB or smaller." };
    }

    const extension = IMAGE_UPLOADER_TYPES[file.type];
    if (!extension) {
      return { error: "Use a JPEG, PNG, or PDF file." };
    }

    const key = `uploads/${crypto.randomUUID()}${extension}`;
    const body = Buffer.from(await file.arrayBuffer());

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: r2BucketName(),
        Key: key,
        Body: body,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return { success: true as const, url: r2PublicUrl(key) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return { error: message };
  }
}

function uploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

async function syncPhotoUrls(
  entityType: UploadEntityType,
  entityId: string,
  url: string,
  mode: "add" | "remove"
) {
  const nextUrls = (current: unknown) => {
    const list = asUrlList(current);
    if (mode === "add") {
      return list.includes(url) ? list : [...list, url];
    }
    return list.filter((item) => item !== url);
  };

  if (entityType === "SITE_SURVEY") {
    const survey = await prisma.siteSurvey.findUnique({
      where: { projectId: entityId },
      select: { id: true, photoUrls: true },
    });
    if (!survey) return;
    await prisma.siteSurvey.update({
      where: { id: survey.id },
      data: { photoUrls: nextUrls(survey.photoUrls) as Prisma.InputJsonValue },
    });
    return;
  }

  if (entityType === "HANDOVER_CERTIFICATE") {
    const cert = await prisma.handoverCertificate.findUnique({
      where: { projectId: entityId },
      select: { id: true, photoUrls: true },
    });
    if (!cert) return;
    await prisma.handoverCertificate.update({
      where: { id: cert.id },
      data: { photoUrls: nextUrls(cert.photoUrls) as Prisma.InputJsonValue },
    });
    return;
  }

  if (entityType === "MATERIAL_APPROVAL") {
    const item = await prisma.materialApproval.findUnique({
      where: { id: entityId },
      select: { id: true, photoUrls: true },
    });
    if (!item) return;
    await prisma.materialApproval.update({
      where: { id: item.id },
      data: { photoUrls: nextUrls(item.photoUrls) as Prisma.InputJsonValue },
    });
    return;
  }

  const item = await prisma.serviceRequest.findUnique({
    where: { id: entityId },
    select: { id: true, photoUrls: true },
  });
  if (!item) return;
  await prisma.serviceRequest.update({
    where: { id: item.id },
    data: { photoUrls: nextUrls(item.photoUrls) as Prisma.InputJsonValue },
  });
}

export async function uploadImage(formData: FormData) {
  try {
    const user = await requireSession();
    const file = formData.get("file");
    const entityTypeRaw = String(formData.get("entityType") ?? "");
    const entityId = String(formData.get("entityId") ?? "").trim();

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose an image to upload." };
    }
    if (!entityId || !isUploadEntityType(entityTypeRaw)) {
      return { error: "Invalid upload target." };
    }
    if (file.size > MAX_BYTES) {
      return { error: "Image must be 8 MB or smaller." };
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return { error: "Use a JPEG, PNG, WebP, or GIF image." };
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    await mkdir(uploadsDir(), { recursive: true });
    await writeFile(
      path.join(uploadsDir(), filename),
      Buffer.from(await file.arrayBuffer())
    );

    const fileUrl = `/uploads/${filename}`;
    const entityType = entityTypeRaw as AttachmentEntityType;

    const attachment = await prisma.fileAttachment.create({
      data: {
        entityId,
        entityType,
        fileUrl,
        uploadedBy: user.id,
      },
    });

    await syncPhotoUrls(entityTypeRaw, entityId, fileUrl, "add");
    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "FileAttachment",
      entityId: attachment.id,
      details: { entityType, parentId: entityId, fileUrl },
    });

    revalidateWorkspace();
    return { success: true as const, id: attachment.id, url: fileUrl };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return { error: message };
  }
}

export async function deleteImage(id: string) {
  try {
    const user = await requireSession();
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return { error: "Photo not found." };
    }

    const relative = attachment.fileUrl.replace(/^\/uploads\//, "");
    if (relative && !relative.includes("..") && !relative.includes("/") && !relative.includes("\\")) {
      try {
        await unlink(path.join(uploadsDir(), relative));
      } catch {
        // File may already be gone on disk.
      }
    }

    await prisma.fileAttachment.delete({ where: { id } });

    if (isUploadEntityType(attachment.entityType)) {
      await syncPhotoUrls(
        attachment.entityType,
        attachment.entityId,
        attachment.fileUrl,
        "remove"
      );
    }

    await writeAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "FileAttachment",
      entityId: id,
      details: {
        entityType: attachment.entityType,
        parentId: attachment.entityId,
        fileUrl: attachment.fileUrl,
      },
    });

    revalidateWorkspace();
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete image.";
    return { error: message };
  }
}
