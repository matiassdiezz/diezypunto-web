/**
 * Redimensiona y comprime una imagen en el cliente para no exceder límites de body en Vercel.
 */
export async function compressImageFile(
  file: File,
  options: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? 1600;
  const quality = options.quality ?? 0.82;
  const maxBytes = options.maxBytes ?? 800_000;

  if (!file.type.startsWith("image/")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxEdge || height > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = file.type === "image/png" ? "image/jpeg" : "image/jpeg";
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, quality),
  );

  if (!blob) return file;

  let q = quality;
  while (blob.size > maxBytes && q > 0.45) {
    q -= 0.08;
    blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mime, q),
    );
    if (!blob) break;
  }

  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: mime });
}
