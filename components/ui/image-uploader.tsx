"use client";

import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { uploadCloudImage } from "@/actions/upload";
import { useI18n } from "@/components/locale-provider";
import { cn } from "cn";

const DEFAULT_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
const DRAWING_ACCEPT =
  "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf";
const ALLOWED = new Set(["image/jpeg", "image/png", "application/pdf"]);

type PendingFile = {
  id: string;
  previewUrl: string;
  isPdf: boolean;
};

export const SHOP_DRAWING_ACCEPT = DRAWING_ACCEPT;

export function ImageUploader({
  urls,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxFiles,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  maxFiles?: number;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const busy = pending.length > 0;
  const drawingMode = accept.includes("pdf");

  async function handleFiles(list: FileList | File[] | null) {
    if (!list?.length) return;
    setError(null);

    const files = Array.from(list).filter((file) => {
      if (!ALLOWED.has(file.type)) {
        setError(t("common.invalidJpegPng"));
        return false;
      }
      return true;
    });

    let nextUrls = urls;
    for (const file of files) {
      if (maxFiles && nextUrls.length >= maxFiles && maxFiles !== 1) {
        break;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setPending((current) => [
        ...current,
        { id, previewUrl, isPdf: file.type === "application/pdf" },
      ]);

      const data = new FormData();
      data.set("file", file);
      const result = await uploadCloudImage(data);

      URL.revokeObjectURL(previewUrl);
      setPending((current) => current.filter((item) => item.id !== id));

      if (result.error || !result.url) {
        setError(result.error ?? t("common.invalidJpegPng"));
        break;
      }
      nextUrls = maxFiles === 1 ? [result.url] : [...nextUrls, result.url];
      onChange(nextUrls);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles !== 1}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground transition-colors dark:bg-input/20",
          over && "border-ring bg-accent/50 text-accent-foreground dark:bg-accent/20"
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Upload className="size-5 opacity-70" />
        )}
        <span>
          {busy
            ? t("common.uploading")
            : drawingMode
              ? t("common.uploadDrawing")
              : t("common.uploadPhoto")}
        </span>
        <span className="text-xs">{t("common.dropHint")}</span>
      </div>

      {urls.length > 0 || pending.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => {
            const isPdf = url.toLowerCase().includes(".pdf");
            return (
              <div
                key={url}
                className="relative size-20 overflow-hidden rounded-lg ring-1 ring-foreground/10"
              >
                {isPdf ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground"
                  >
                    <FileText className="size-5" />
                    <span className="text-[10px]">PDF</span>
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="size-full object-cover" />
                )}
                <button
                  type="button"
                  className="absolute end-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground shadow-sm"
                  aria-label={t("common.removePhoto")}
                  onClick={() => onChange(urls.filter((item) => item !== url))}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
          {pending.map((item) => (
            <div
              key={item.id}
              className="relative size-20 overflow-hidden rounded-lg ring-1 ring-foreground/10"
            >
              {item.isPdf ? (
                <div className="flex size-full items-center justify-center bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="size-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImagePlus className="size-3.5" />
          {t("common.noPhotos")}
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
