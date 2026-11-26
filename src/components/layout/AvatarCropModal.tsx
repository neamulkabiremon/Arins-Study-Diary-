"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

const OUT = 320;

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

/**
 * Circular avatar crop — stays inside the viewport on Mac + iPhone.
 * Zoom is a 1–3× multiplier on top of cover-fit.
 */
export function AvatarCropModal({ file, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const frameRef = useRef<HTMLDivElement>(null);

  const scale = baseScale * zoom;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      setNatural({
        w: img.naturalWidth || 1,
        h: img.naturalHeight || 1,
      });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const recomputeBase = useCallback(() => {
    const frame = frameRef.current?.clientWidth ?? 0;
    if (!frame || !natural.w) return;
    const cover = Math.max(frame / natural.w, frame / natural.h);
    setBaseScale(cover);
  }, [natural.h, natural.w]);

  useLayoutEffect(() => {
    recomputeBase();
  }, [recomputeBase, src]);

  useEffect(() => {
    const onResize = () => recomputeBase();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeBase]);

  const clampOffset = useCallback(
    (x: number, y: number, s: number) => {
      const frame = frameRef.current?.clientWidth ?? 200;
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
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(clampOffset(drag.current.ox + dx, drag.current.oy + dy, scale));
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onZoom(next: number) {
    const z = Math.max(1, Math.min(3, next));
    const s = baseScale * z;
    setZoom(z);
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

    const frame = frameRef.current?.clientWidth || 200;
    const ratio = OUT / frame;
    const dw = natural.w * scale * ratio;
    const dh = natural.h * scale * ratio;
    const dx = OUT / 2 - dw / 2 + offset.x * ratio;
    const dy = OUT / 2 - dh / 2 + offset.y * ratio;

    ctx.fillStyle = "#1a1520";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, dx, dy, dw, dh);
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  }

  const panel = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal
      aria-label="Crop profile photo"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[min(100dvh,100vh)] w-full max-w-[22rem] flex-col overflow-hidden rounded-2xl bg-[#2a2435] text-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Fit your photo
          </p>
          <p className="mt-1 text-sm text-white/70">
            Drag to center · zoom to fill the circle
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="mx-auto flex w-full max-w-full flex-col items-center gap-4">
            <div
              ref={frameRef}
              className="relative aspect-square w-[min(14rem,calc(100vw-3.5rem))] touch-none overflow-hidden rounded-full bg-black/40 ring-2 ring-lavender/70"
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

            <label className="flex w-full min-w-0 max-w-full flex-col gap-1.5 text-xs font-semibold text-white/60">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => onZoom(Number(e.target.value))}
                className="crop-zoom-range block w-full max-w-full min-w-0 accent-[#9b7bb8]"
              />
            </label>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-white/10 px-4 py-3">
          <Button
            variant="ghost"
            className="min-w-0 flex-1 text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button className="min-w-0 flex-1" onClick={() => void confirm()}>
            Use photo
          </Button>
        </div>
      </div>

    </div>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}
