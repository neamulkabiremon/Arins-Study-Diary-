/**
 * Smart notebook framing: find the handwritten page (ink on paper),
 * not the whole desk or a background worksheet underneath.
 */

type Rect = { sx: number; sy: number; sw: number; sh: number };

export async function cropNotebookFocus(file: File): Promise<{
  file: File;
  previewUrl: string;
}> {
  const bitmap = await loadImage(file);
  const { width: w, height: h } = bitmap;

  const detected = detectHandwrittenPage(bitmap, w, h);
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
 * Prefer the region that is both paper-like AND has handwriting (dark ink),
 * so a small notepad on top of a printed worksheet wins over the worksheet.
 */
function detectHandwrittenPage(
  source: CanvasImageSource,
  fullW: number,
  fullH: number,
): Rect | null {
  const analyzeW = 400;
  const analyzeH = Math.max(1, Math.round((analyzeW * fullH) / fullW));
  const canvas = document.createElement("canvas");
  canvas.width = analyzeW;
  canvas.height = analyzeH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0, analyzeW, analyzeH);
  const { data } = ctx.getImageData(0, 0, analyzeW, analyzeH);

  const paper = new Uint8Array(analyzeW * analyzeH);
  const ink = new Uint8Array(analyzeW * analyzeH);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = max === 0 ? 0 : (max - min) / max;

    // Paper: bright-ish, not saturated bedsheet/binder
    if (luma >= 140 && sat <= 0.35 && min >= 95) paper[p] = 1;
    // Ink: dark strokes (blue/black pen) on that paper
    if (luma <= 110 && sat <= 0.55) ink[p] = 1;
  }

  // Sliding window: score = ink on paper. Best window ≈ notebook page.
  const winScales = [
    { wf: 0.35, hf: 0.55 },
    { wf: 0.42, hf: 0.65 },
    { wf: 0.5, hf: 0.72 },
    { wf: 0.58, hf: 0.8 },
    { wf: 0.28, hf: 0.45 },
  ];

  let best: { x: number; y: number; w: number; h: number; score: number } | null =
    null;

  for (const { wf, hf } of winScales) {
    const ww = Math.max(24, Math.round(analyzeW * wf));
    const hh = Math.max(32, Math.round(analyzeH * hf));
    const stepX = Math.max(4, Math.floor(ww / 6));
    const stepY = Math.max(4, Math.floor(hh / 6));

    for (let y = 0; y <= analyzeH - hh; y += stepY) {
      for (let x = 0; x <= analyzeW - ww; x += stepX) {
        let paperHits = 0;
        let inkHits = 0;
        for (let yy = y; yy < y + hh; yy++) {
          const row = yy * analyzeW;
          for (let xx = x; xx < x + ww; xx++) {
            const i = row + xx;
            if (paper[i]) paperHits++;
            if (ink[i] && paper[i]) inkHits++;
            else if (ink[i]) inkHits += 0.35; // ink near page still counts a little
          }
        }
        const area = ww * hh;
        const paperRatio = paperHits / area;
        const inkRatio = inkHits / area;
        if (paperRatio < 0.35) continue;
        if (inkRatio < 0.008) continue;
        // Reward ink density; mild preference for centered windows
        const cx = (x + ww / 2) / analyzeW;
        const cy = (y + hh / 2) / analyzeH;
        const center =
          1 - Math.min(1, Math.hypot(cx - 0.5, cy - 0.48) * 1.4);
        const score = inkRatio * 12 + paperRatio * 0.8 + center * 0.25;
        if (!best || score > best.score) {
          best = { x, y, w: ww, h: hh, score };
        }
      }
    }
  }

  if (!best) {
    // Fallback: classic paper bbox if window search fails
    return paperProjectionBBox(paper, analyzeW, analyzeH, fullW, fullH);
  }

  // Tighten to ink+paper mass inside the winning window
  let x0 = best.x;
  let x1 = best.x + best.w - 1;
  let y0 = best.y;
  let y1 = best.y + best.h - 1;
  const col = new Float32Array(best.w);
  const row = new Float32Array(best.h);
  for (let yy = best.y; yy < best.y + best.h; yy++) {
    for (let xx = best.x; xx < best.x + best.w; xx++) {
      const i = yy * analyzeW + xx;
      if (paper[i] || ink[i]) {
        col[xx - best.x]!++;
        row[yy - best.y]!++;
      }
    }
  }
  const cThr = best.h * 0.05;
  const rThr = best.w * 0.05;
  while (x0 < x1 && col[x0 - best.x]! < cThr) x0++;
  while (x1 > x0 && col[x1 - best.x]! < cThr) x1--;
  while (y0 < y1 && row[y0 - best.y]! < rThr) y0++;
  while (y1 > y0 && row[y1 - best.y]! < rThr) y1--;

  const padX = (x1 - x0) * 0.08;
  const padY = (y1 - y0) * 0.06;
  const scaleX = fullW / analyzeW;
  const scaleY = fullH / analyzeH;

  let sx = (x0 - padX) * scaleX;
  let sy = (y0 - padY) * scaleY;
  let sw = (x1 - x0 + 1 + padX * 2) * scaleX;
  let sh = (y1 - y0 + 1 + padY * 2) * scaleY;

  sx = Math.max(0, Math.min(sx, fullW - 2));
  sy = Math.max(0, Math.min(sy, fullH - 2));
  sw = Math.min(fullW - sx, Math.max(fullW * 0.15, sw));
  sh = Math.min(fullH - sy, Math.max(fullH * 0.15, sh));

  return { sx, sy, sw, sh };
}

function paperProjectionBBox(
  paper: Uint8Array,
  analyzeW: number,
  analyzeH: number,
  fullW: number,
  fullH: number,
): Rect | null {
  const colHits = new Float32Array(analyzeW);
  const rowHits = new Float32Array(analyzeH);
  let count = 0;
  for (let y = 0; y < analyzeH; y++) {
    for (let x = 0; x < analyzeW; x++) {
      if (!paper[y * analyzeW + x]) continue;
      colHits[x]!++;
      rowHits[y]!++;
      count++;
    }
  }
  if (count / (analyzeW * analyzeH) < 0.05) return null;

  const colThresh = analyzeH * 0.05;
  const rowThresh = analyzeW * 0.05;
  let x0 = 0;
  let x1 = analyzeW - 1;
  let y0 = 0;
  let y1 = analyzeH - 1;
  while (x0 < analyzeW && colHits[x0]! < colThresh) x0++;
  while (x1 > x0 && colHits[x1]! < colThresh) x1--;
  while (y0 < analyzeH && rowHits[y0]! < rowThresh) y0++;
  while (y1 > y0 && rowHits[y1]! < rowThresh) y1--;

  const scaleX = fullW / analyzeW;
  const scaleY = fullH / analyzeH;
  const padX = (x1 - x0) * 0.05;
  const padY = (y1 - y0) * 0.05;
  let sx = (x0 - padX) * scaleX;
  let sy = (y0 - padY) * scaleY;
  let sw = (x1 - x0 + 1 + padX * 2) * scaleX;
  let sh = (y1 - y0 + 1 + padY * 2) * scaleY;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(fullW - sx, sw);
  sh = Math.min(fullH - sy, sh);
  return { sx, sy, sw, sh };
}

function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}
