import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { errorMessage } from "@/lib/api";
import { cropToSquare, type CropArea } from "@/lib/crop";
import { useUpdateMe } from "@/lib/queries";
import type { Me } from "@/lib/types";
import { ACCEPT_ATTRIBUTE, ACCEPTED_IMAGES, uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

// The cropper is only needed once someone has picked a picture.
const Cropper = lazy(() => import("react-easy-crop"));

function PhotoEditor({ me, onDone }: { me: Me; onDone: () => void }) {
  const update = useUpdateMe();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source);
  }, [source]);

  function pick(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGES.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setSource(URL.createObjectURL(file));
  }

  async function save() {
    if (!source || !area) return;
    setBusy(true);
    setError(null);
    try {
      const file = await cropToSquare(source, area);
      const url = await uploadImage(file, "user_avatar");
      await update.mutateAsync({ avatar_url: url });
      toast.success("Photo updated");
      onDone();
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(false);
    }
  }

  function remove() {
    update.mutate(
      { avatar_url: null },
      {
        onSuccess: () => {
          toast.success("Photo removed");
          onDone();
        },
        onError: (problem) => setError(errorMessage(problem)),
      },
    );
  }

  const picker = (
    <input
      ref={input}
      type="file"
      accept={ACCEPT_ATTRIBUTE}
      className="sr-only"
      tabIndex={-1}
      aria-label="Choose a photo"
      onChange={(event) => pick(event.target.files?.[0])}
    />
  );
  const problem = error && (
    <p role="alert" className="text-sm font-medium text-danger">
      {error}
    </p>
  );

  if (!source) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-field border border-dashed px-6 py-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary-soft"
              : "border-line hover:border-ink",
          )}
        >
          <Avatar user={me} size="xl" />
          <span className="flex items-center gap-2 font-medium">
            <ImagePlus className="size-5" aria-hidden />
            {me.avatar_url ? "Choose a new photo" : "Choose a photo"}
          </span>
          <span className="text-sm text-ink-soft">
            Or drop one here. You'll frame it next.
          </span>
        </button>
        {picker}
        {problem}
        {me.avatar_url && (
          <Button
            variant="ghost"
            className="self-center"
            loading={update.isPending}
            onClick={remove}
          >
            {!update.isPending && <Trash2 aria-hidden />} Remove photo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-field bg-black">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner className="size-8 text-paper" />
            </div>
          }
        >
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            objectFit="cover"
            showGrid={false}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </Suspense>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        Zoom
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-11 flex-1 accent-(--primary)"
        />
      </label>
      <p className="-mt-2 text-sm text-ink-soft">
        Drag the picture to frame your face.
      </p>
      {picker}
      {problem}
      <div className="flex flex-wrap justify-between gap-3">
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          Choose another
        </Button>
        <Button loading={busy} disabled={!area} onClick={() => void save()}>
          {busy ? "Saving…" : "Save photo"}
        </Button>
      </div>
    </div>
  );
}

/** Pick, frame and save a profile photo in one go. It saves on its own. */
export function PhotoDialog({
  me,
  open,
  onOpenChange,
}: {
  me: Me;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Profile photo"
      description="A clear picture of your face works best at small sizes."
      locked
    >
      {open && <PhotoEditor me={me} onDone={() => onOpenChange(false)} />}
    </Dialog>
  );
}
