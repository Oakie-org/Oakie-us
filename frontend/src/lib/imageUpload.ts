/**
 * Image upload utilities with compression and S3 presigned URL support.
 */
import imageCompression from "browser-image-compression";
import { fetchAuthSession } from "aws-amplify/auth";

// API base URL
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/+$/, "")
  .trim();

/**
 * Get current access token from Amplify auth session.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/**
 * Image configuration for different upload purposes.
 */
export const IMAGE_CONFIG = {
  project_cover: {
    maxSizeMB: 5, // Max file size before compression
    targetSizeMB: 0.5, // Target size after compression
    maxWidth: 800,
    maxHeight: 420,
    aspectRatio: 1.91,
    label: "Project Cover",
  },
  user_avatar: {
    maxSizeMB: 2,
    targetSizeMB: 0.1,
    maxWidth: 400,
    maxHeight: 400,
    aspectRatio: 1,
    label: "User Avatar",
  },
} as const;

export type ImagePurpose = keyof typeof IMAGE_CONFIG;

/**
 * Response from the signing endpoint.
 */
export interface SignedUrlResponse {
  url: string;
  fields: Record<string, string>;
  public_url: string;
}

/**
 * Validate file before upload.
 */
export function validateImage(
  file: File,
  purpose: ImagePurpose,
): string | null {
  const config = IMAGE_CONFIG[purpose];

  // Check file type
  if (!file.type.startsWith("image/")) {
    return "Please select an image file";
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > config.maxSizeMB) {
    return `File too large. Maximum size is ${config.maxSizeMB}MB`;
  }

  return null; // Valid
}

/**
 * Compress and optionally convert image to WebP.
 */
export async function compressImage(
  file: File,
  purpose: ImagePurpose,
): Promise<File> {
  const config = IMAGE_CONFIG[purpose];

  const options = {
    maxSizeMB: config.targetSizeMB,
    maxWidthOrHeight: Math.max(config.maxWidth, config.maxHeight),
    useWebWorker: true,
    fileType: "image/webp" as const,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch {
    // If compression fails, return original file
    console.warn("Image compression failed, using original file");
    return file;
  }
}

/**
 * Get a presigned URL for uploading to S3.
 */
export async function getSignedUrl(
  fileType: string,
  purpose: ImagePurpose,
): Promise<SignedUrlResponse> {
  const token = await getAccessToken();

  const base = API_BASE_URL || "";
  const response = await fetch(`${base}/api/v1/uploads/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      file_type: fileType,
      purpose,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get signed URL: ${error}`);
  }

  return response.json();
}

/**
 * Upload file to S3 using presigned URL.
 */
export async function uploadToS3(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // Append all fields from the presigned post response
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Append file last (required by S3)
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    // POST request for presigned post
    xhr.open("POST", url);
    // Do NOT set Content-Type header manually for FormData, browser sets it with boundary
    xhr.send(formData);
  });
}
