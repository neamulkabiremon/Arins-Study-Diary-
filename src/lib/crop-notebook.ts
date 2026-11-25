/**
 * Crops desk photos toward the notebook page (usually right/center)
 * so dashboard + Plan tomorrow previews match the mock framing.
 */

export async function cropNotebookFocus(file: File): Promise<{
  file: File;
  previewUrl: string;
}> {
  const bitmap = await loadImage(file);
  const { width: w, height: h } = bitmap;

  // Portrait / already notebook-ish → mild center crop
  // Wide desk shots → favor the right notebook column
  const isWide = w / h > 0.95;
  const sx = isWide ? w * 0.4 : w * 0.08;
  const sy = isWide ? h * 0.06 : h * 0.05;
  const sw = isWide ? w * 0.58 : w * 0.84;
  const sh = isWide ? h * 0.88 : h * 0.9;

  const outW = 900;
  const outH = Math.round(outW * 1.25); // ~4:5 like mock card

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const previewUrl = URL.createObjectURL(file);
    return { file, previewUrl };
  }

  ctx.fillStyle = "#fff9f2";
  ctx.fillRect(0, 0, outW, outH);

  // Cover-fit the crop rect into 4:5
  const srcAspect = sw / sh;
  const dstAspect = outW / outH;
  let dw = outW;
  let dh = outH;
  let dx = 0;
  let dy = 0;
  if (srcAspect > dstAspect) {
    dh = outH;
    dw = outH * srcAspect;
    dx = (outW - dw) / 2;
  } else {
    dw = outW;
    dh = outW / srcAspect;
    dy = (outH - dh) / 2;
  }

  ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
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
