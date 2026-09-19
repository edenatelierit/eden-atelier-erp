"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { deleteImage, uploadImage } from "@/actions/upload";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { PhotoItem, UploadEntityType } from "@/lib/photos";

export function ImageUpload({
  entityType,
  entityId,
  photos,
}: {
  entityType: UploadEntityType;
  entityId: string;
  photos: PhotoItem[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setPending(true);
    setError(null);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.set("file", file);
      data.set("entityType", entityType);
      data.set("entityId", entityId);
      const result = await uploadImage(data);
      if (result.error) {
        setError(result.error);
        break;
      }
    }

    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function onRemove(id: string) {
    setPending(true);
    setError(null);
    const result = await deleteImage(id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={(event) => onFiles(event.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative size-20 overflow-hidden rounded-lg ring-1 ring-foreground/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              className="size-full object-cover"
            />
            <button
              type="button"
              className="absolute end-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground shadow-sm"
              aria-label={t("common.removePhoto")}
              disabled={pending}
              onClick={() => onRemove(photo.id)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {pending ? t("common.uploading") : t("common.upload")}
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("common.noPhotos")}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
