/**
 * Hook for handling image upload with compression and S3 presigned URLs.
 */
import { useState, useCallback } from "react";
import {
  validateImage,
  compressImage,
  getSignedUrl,
  uploadToS3,
} from "@/lib/imageUpload";
import type { ImagePurpose } from "@/lib/imageUpload";

export interface UseImageUploadOptions {
  purpose: ImagePurpose;
  onSuccess?: (publicUrl: string) => void;
  onError?: (error: Error) => void;
}

export interface UseImageUploadReturn {
  upload: (file: File) => Promise<string | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useImageUpload({
  purpose,
  onSuccess,
  onError,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setError(null);
      setProgress(0);

      // Validate
      const validationError = validateImage(file, purpose);
      if (validationError) {
        setError(validationError);
        onError?.(new Error(validationError));
        return null;
      }

      setIsUploading(true);

      try {
        // Compress image
        setProgress(10);
        const compressedFile = await compressImage(file, purpose);

        // Get presigned URL
        setProgress(30);
        const { url, fields, public_url } = await getSignedUrl(
          compressedFile.type,
          purpose,
        );

        // Upload to S3
        await uploadToS3(url, fields, compressedFile, (p) => {
          // Map 0-100 to 30-100
          setProgress(30 + Math.round(p * 0.7));
        });

        setProgress(100);
        onSuccess?.(public_url);
        return public_url;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error.message);
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [purpose, onSuccess, onError],
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}
