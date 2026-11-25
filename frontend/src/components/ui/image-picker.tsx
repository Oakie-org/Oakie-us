import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { errorMessage } from "@/lib/api";
import type { UploadPurpose } from "@/lib/types";
import { ACCEPT_ATTRIBUTE, uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";

interface ImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  purpose: UploadPurpose;
  label: string;
  /** Renders the current image, if there is one. */
  preview: ReactNode;
  /** Replaces the default note about accepted formats. */
  hint?: string;
}

/** Pick, upload and clear a single image, with progress and error feedback. */
export function ImagePicker({
  value,
  onChange,
  purpose,
  label,
  preview,
  hint = "JPEG, PNG, WebP or GIF. Large photos are resized for you.",
}: ImagePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, purpose));
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        {preview}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => input.current?.click()}
          >
            {!busy && <ImagePlus aria-hidden />}
            {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
          </Button>
          {value && !busy && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 aria-hidden /> Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : (
        <p className="text-sm text-ink-soft">{hint}</p>
      )}
    </div>
  );
}
