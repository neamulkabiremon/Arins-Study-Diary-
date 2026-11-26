/**
 * Smart notebook framing: detect the bright paper page in a desk photo
 * and crop tightly around it (works for small notepads on beds / books).
 */

type Rect = { sx: number; sy: number; sw: number; sh: number };

export async function cropNotebookFocus(file: File): Promise<{
  file: File;
  previewUrl: string;
}> {
  const bitmap = await loadImage(file);
  const { width: w, height: h } = bitmap;

  const detected = detectPaperRect(bitmap, w, h);
  const rect = detected ?? softFullFrame(w, h);

  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(rect.sw, rect.sh));
  const outW = Math.max(1, Math.round(rect.sw * scale));
  const outH = Math.max(1, Math.round(rect.sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) {
    if ("close" in bitmap) bitmap.close();
    return { file, previewUrl: URL.createObjectURL(file) };
  }

  ctx.fillStyle = "#fff9f2";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(
    bitmap,
    rect.sx,
    rect.sy,
    rect.sw,
    rect.sh,
    0,
    0,
    outW,
    outH,
  );
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) {
    return { file, previewUrl: URL.createObjectURL(file) };
  }

  const cropped = new File(
    [blob],
    file.name.replace(/\.\w+$/, "") + "-notebook.jpg",
    { type: "image/jpeg" },
  );
  return { file: cropped, previewUrl: URL.createObjectURL(blob) };
}

function softFullFrame(w: number, h: number): Rect {
  const trim = 0.02;
  return {
    sx: w * trim,
    sy: h * trim,
    sw: w * (1 - trim * 2),
    sh: h * (1 - trim * 2),
  };
}

/**
 * Find the largest bright, low-saturation region (paper) via downscaled analysis.
 */
function detectPaperRect(
  source: CanvasImageSource,
  fullW: number,
  fullH: number,
): Rect | null {
  const analyzeW = 360;
  const analyzeH = Math.max(1, Math.round((analyzeW * fullH) / fullW));
  const canvas = document.createElement("canvas");
  canvas.width = analyzeW;
  canvas.height = analyzeH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0, analyzeW, analyzeH);
  const { data } = ctx.getImageData(0, 0, analyzeW, analyzeH);

  const mask = new Uint8Array(analyzeW * analyzeH);
  let paperCount = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = max === 0 ? 0 : (max - min) / max;
    // White / cream paper: bright + not colorful (rejects red sheet / blue binder)
    const isPaper = luma >= 155 && sat <= 0.28 && min >= 110;
    if (isPaper) {
      mask[p] = 1;
      paperCount++;
    }
  }

  // Need a meaningful paper blob
  const coverage = paperCount / (analyzeW * analyzeH);
  if (coverage < 0.04 || coverage > 0.92) return null;

  // Column / row density → tight bbox around paper mass
  const colHits = new Float32Array(analyzeW);
  const rowHits = new Float32Array(analyzeH);
  for (let y = 0; y < analyzeH; y++) {
    for (let x = 0; x < analyzeW; x++) {
      if (mask[y * analyzeW + x]) {
        colHits[x]!++;
        rowHits[y]!++;
      }
    }
  }

  const colThresh = analyzeH * 0.04;
  const rowThresh = analyzeW * 0.04;
  let x0 = 0;
  let x1 = analyzeW - 1;
  let y0 = 0;
  let y1 = analyzeH - 1;

  while (x0 < analyzeW && colHits[x0]! < colThresh) x0++;
  while (x1 > x0 && colHits[x1]! < colThresh) x1--;
  while (y0 < analyzeH && rowHits[y0]! < rowThresh) y0++;
  while (y1 > y0 && rowHits[y1]! < rowThresh) y1--;

  // Shrink inward past weak edges (desk noise)
  const refine = (hits: Float32Array, a: number, b: number, thr: number) => {
    let lo = a;
    let hi = b;
    const strong = thr * 2.2;
    while (lo < hi && hits[lo]! < strong) lo++;
    while (hi > lo && hits[hi]! < strong) hi--;
    return [lo, hi] as const;
  };
  [x0, x1] = refine(colHits, x0, x1, colThresh);
  [y0, y1] = refine(rowHits, y0, y1, rowThresh);

  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  if (bw < analyzeW * 0.12 || bh < analyzeH * 0.18) return null;
  if (bw * bh < analyzeW * analyzeH * 0.06) return null;

  // Map to full-res + padding so spiral / edges aren't clipped
  const padX = bw * 0.06;
  const padY = bh * 0.05;
  const scaleX = fullW / analyzeW;
  const scaleY = fullH / analyzeH;

  let sx = (x0 - padX) * scaleX;
  let sy = (y0 - padY) * scaleY;
  let sw = (bw + padX * 2) * scaleX;
  let sh = (bh + padY * 2) * scaleY;

  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(fullW - sx, sw);
  sh = Math.min(fullH - sy, sh);

  // Prefer a portrait page crop if the paper is taller than wide
  if (sh > sw * 1.05) {
    // already portrait-ish
  } else if (sw > sh * 1.15) {
    // Wide paper detection sometimes grabs binder — tighten to center band
    const targetW = sh * 0.78;
    if (targetW < sw) {
      sx += (sw - targetW) / 2;
      sw = targetW;
    }
  }

  if (sw < fullW * 0.1 || sh < fullH * 0.1) return null;
  return { sx, sy, sw, sh };
}

function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}
