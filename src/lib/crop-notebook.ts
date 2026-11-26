/**
 * Prepares notebook photos for preview + Bedrock.
 * Keeps nearly the full page (gentle margin trim) — no aggressive desk crop.
 */

export async function cropNotebookFocus(file: File): Promise<{
  file: File;
  previewUrl: string;
}> {
  const bitmap = await loadImage(file);
  const { width: w, height: h } = bitmap;

  // Soft edge trim only (~3%) so the whole planner page stays visible
  const trim = 0.03;
  const sx = w * trim;
  const sy = h * trim;
  const sw = w * (1 - trim * 2);
  const sh = h * (1 - trim * 2);

  // Cap long edge for upload size; keep aspect ratio of the page
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in bitmap) bitmap.close();
    const previewUrl = URL.createObjectURL(file);
    return { file, previewUrl };
  }

  ctx.fillStyle = "#fff9f2";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) {
    const previewUrl = URL.createObjectURL(file);
    return { file, previewUrl };
  }

  const cropped = new File(
    [blob],
    file.name.replace(/\.\w+$/, "") + "-notebook.jpg",
    { type: "image/jpeg" },
  );
  return { file: cropped, previewUrl: URL.createObjectURL(blob) };
}

function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}
