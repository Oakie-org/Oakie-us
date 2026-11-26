import { api, ApiError } from "@/lib/api";
import type { SignedUpload, UploadPurpose } from "@/lib/types";

export const ACCEPTED_IMAGES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGES.join(",");

/**
 * Upload an image straight from the browser to storage and return its public
 * URL. Large photos are downscaled first so they fit the server-side limit.
 */
export async function uploadImage(
  file: File,
  purpose: UploadPurpose,
): Promise<string> {
  if (!ACCEPTED_IMAGES.includes(file.type)) {
    throw new ApiError(400, "Choose a JPEG, PNG, WebP or GIF image.");
  }

  let payload = file;
  if (file.type !== "image/gif" && file.size > 900_000) {
    const { default: compress } = await import("browser-image-compression");
    payload = await compress(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: purpose === "user_avatar" ? 640 : 1920,
      useWebWorker: true,
    });
  }

  const signed = await api.post<SignedUpload>("/uploads/sign", {
    file_type: payload.type,
    purpose,
  });
  if (payload.size > signed.max_bytes) {
    throw new ApiError(
      400,
      `That image is too large. The limit is ${Math.round(
        signed.max_bytes / 1048576,
      )} MB.`,
    );
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(signed.fields))
    form.append(key, value);
  form.append("file", payload); // S3 requires the file to be the last field.

  const response = await fetch(signed.url, {
    method: "POST",
    body: form,
  }).catch(() => null);
  if (!response || !response.ok) {
    throw new ApiError(
      response?.status ?? 0,
      "The upload didn't go through. Please try again.",
    );
  }
  return signed.public_url;
}
