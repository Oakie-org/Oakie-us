export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cut `area` (in the picture's own pixels) out of the picture at `src` and
 * return it as a square JPEG no larger than `size`. Small pictures are never
 * scaled up.
 */
export async function cropToSquare(
  src: string,
  area: CropArea,
  size = 512,
): Promise<File> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const side = Math.max(1, Math.round(Math.min(size, area.width)));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't edit pictures.");
  // JPEG has no transparency: a cut-out PNG lands on white, not black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, side, side);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    side,
    side,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("That picture couldn't be read. Try another.");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
