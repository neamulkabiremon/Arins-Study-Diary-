"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const OUT = 320;

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

/**
 * Circular avatar crop — drag to pan, slider to zoom, then export a square JPEG.
 */
export function AvatarCropModal({ file, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      setNatural({ w, h });
      // Cover the circular frame (assume ~260px preview)
      const frame = 260;
      const cover = Math.max(frame / w, frame / h);
      setMinScale(cover);
      setScale(cover);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback(
    (x: number, y: number, s: number) => {
      const frame = frameRef.current?.clientWidth ?? 260;
      const dw = natural.w * s;
      const dh = natural.h * s;
      const maxX = Math.max(0, (dw - frame) / 2);
      const maxY = Math.max(0, (dh - frame) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [natural.h, natural.w],
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(
      clampOffset(drag.current.ox + dx, drag.current.oy + dy, scale),
    );
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onZoom(next: number) {
    const s = Math.max(minScale, Math.min(minScale * 3, next));
    setScale(s);
    setOffset((o) => clampOffset(o.x, o.y, s));
  }

  async function confirm() {
    if (!src) return;
    const img = await loadHtmlImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frame = frameRef.current?.clientWidth ?? 260;
    const ratio = OUT / frame;
    // Image is centered in frame, then offset, then scaled
    const dw = natural.w * scale * ratio;
    const dh = natural.h * scale * ratio;
    const dx = OUT / 2 - dw / 2 + offset.x * ratio;
    const dy = OUT / 2 - dh / 2 + offset.y * ratio;

    ctx.fillStyle = "#1a1520";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, dx, dy, dw, dh);

    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Crop profile photo"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#2a2435] text-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Fit your photo
          </p>
          <p className="mt-1 text-sm text-white/70">
            Drag to center your face · zoom so it fills the circle
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 px-4 py-5">
          <div
            ref={frameRef}
            className="relative h-[260px] w-[260px] touch-none overflow-hidden rounded-full bg-black/40 ring-2 ring-lavender/70"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: natural.w * scale,
                  height: natural.h * scale,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : null}
          </div>

          <label className="flex w-full flex-col gap-1 text-xs font-semibold text-white/60">
            Zoom
            <input
              type="range"
              min={minScale}
              max={minScale * 3}
              step={0.01}
              value={scale}
              onChange={(e) => onZoom(Number(e.target.value))}
              className="w-full accent-[#9b7bb8]"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-white/10 px-4 py-3">
          <Button variant="ghost" className="flex-1 text-white" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => void confirm()}>
            Use photo
          </Button>
        </div>
      </div>
    </div>
  );
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}
