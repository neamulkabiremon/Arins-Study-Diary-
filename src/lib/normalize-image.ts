/**
 * Normalize notebook photos for Bedrock (JPEG/PNG/WebP only).
 * Converts HEIC/HEIF to high-quality JPEG at (near) original resolution.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 4096;
const JPEG_QUALITY = 0.95;

export function isHeicLike(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  const name = file.name || "";
  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "image/heic-sequence" ||
    mime === "image/heif-sequence" ||
    /\.heic$/i.test(name) ||
    /\.heif$/i.test(name)
  );
}

function jpegName(original: string): string {
  const base = (original || "notebook").replace(/\.[^.]+$/, "") || "notebook";
  return `${base}.jpg`;
}

async function canvasToJpegFile(
  source: CanvasImageSource,
  width: number,
  height: number,
  fileName: string,
  quality: number,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not encode JPEG");

  return new File([blob], jpegName(fileName), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function scaledSize(w: number, h: number, maxEdge: number) {
  const long = Math.max(w, h);
  if (long <= maxEdge) return { width: w, height: h };
  const scale = maxEdge / long;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

async function decodeViaBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function decodeViaImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Browser could not decode this photo"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function heicViaLibrary(file: File, quality: number): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error("HEIC conversion returned an empty result");
  }
  return new File([blob], jpegName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function rasterToJpeg(file: File, quality: number): Promise<File> {
  try {
    const bitmap = await decodeViaBitmap(file);
    const { width, height } = scaledSize(
      bitmap.width,
      bitmap.height,
      MAX_EDGE,
    );
    const out = await canvasToJpegFile(
      bitmap,
      width,
      height,
      file.name,
      quality,
    );
    if ("close" in bitmap) bitmap.close();
    return out;
  } catch {
    const img = await decodeViaImageElement(file);
    const { width, height } = scaledSize(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      MAX_EDGE,
    );
    return canvasToJpegFile(img, width, height, file.name, quality);
  }
}

/**
 * Returns a Bedrock-safe JPEG. Keeps near-original resolution and high quality.
 */
export async function normalizeImageForAi(file: File): Promise<File> {
  const mime = (file.type || "").toLowerCase();
  const heic = isHeicLike(file);
  const alreadyOk =
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/webp";

  // Always re-encode camera/HEIC-ish photos to a clean JPEG Bedrock accepts.
  // Tiny already-safe JPEGs under 1.5MB can pass through.
  if (
    alreadyOk &&
    !heic &&
    file.size <= 1.5 * 1024 * 1024 &&
    (mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png")
  ) {
    return file;
  }

  // Prefer native decode (Safari often handles HEIC), then heic2any.
  let converted: File | null = null;
  try {
    converted = await rasterToJpeg(file, JPEG_QUALITY);
  } catch {
    if (heic || !alreadyOk) {
      converted = await heicViaLibrary(file, JPEG_QUALITY);
    } else {
      throw new Error(
        "Could not prepare this photo. Try JPG or PNG, or enter tasks manually.",
      );
    }
  }

  if (converted.size <= MAX_BYTES) return converted;

  // Still too big — recompress with slightly lower quality / smaller edge
  const smaller = await rasterToJpeg(converted, 0.88);
  if (smaller.size <= MAX_BYTES) return smaller;

  const bitmap = await decodeViaBitmap(smaller);
  const { width, height } = scaledSize(bitmap.width, bitmap.height, 2400);
  const out = await canvasToJpegFile(
    bitmap,
    width,
    height,
    file.name,
    0.85,
  );
  if ("close" in bitmap) bitmap.close();
  if (out.size > MAX_BYTES) {
    throw new Error("Photo is still too large after conversion (max 8 MB).");
  }
  return out;
}
