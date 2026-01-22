/**
 * Reusable image uploader component with compression, preview, and progress.
 */
import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import { IMAGE_CONFIG, type ImagePurpose } from "@/lib/imageUpload";

interface ImageUploaderProps {
  purpose: ImagePurpose;
  onUpload: (url: string) => void;
  currentUrl?: string;
  className?: string;
}

export function ImageUploader({
  purpose,
  onUpload,
  currentUrl,
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null,
  );

  const { upload, isUploading, progress, error, reset } = useImageUpload({
    purpose,
    onSuccess: (url) => {
      onUpload(url);
    },
  });

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      const publicUrl = await upload(file);
      if (!publicUrl) {
        // Upload failed, clear preview if no previous URL
        if (!currentUrl) {
          setPreviewUrl(null);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload, currentUrl],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewUrl(null);
      onUpload("");
      reset();
    },
    [onUpload, reset],
  );

  const config = IMAGE_CONFIG[purpose];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer",
        "hover:border-primary hover:bg-primary/5",
        isUploading && "pointer-events-none",
        error && "border-destructive",
        previewUrl ? "border-transparent" : "border-muted-foreground/25",
        className,
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      aria-label={`Upload ${config.label}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
      />

      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          {!isUploading && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
          <ImagePlus className="size-8" />
          <span className="text-sm">Click to upload</span>
          <span className="text-xs opacity-60">
            Max {config.maxSizeMB}MB • JPG, PNG, WebP
          </span>
        </div>
      )}

      {/* Progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm mt-2">{progress}%</span>
        </div>
      )}

      {/* Error message */}
      {error && !isUploading && (
        <div className="absolute bottom-2 left-2 right-2 text-xs text-destructive text-center">
          {error}
        </div>
      )}
    </div>
  );
}
