"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type PickMode = "library" | "camera" | "file";

export function PhotoUploader({
  previewUrl,
  extracting,
  progress,
  onFile,
  onClear,
  onRetryExtract,
  confirmed = false,
}: {
  previewUrl: string | null;
  extracting: boolean;
  progress: number | null;
  onFile: (file: File, preview: string) => void;
  onClear: () => void;
  onRetryExtract: () => void;
  /** After Confirm plan — quieter chrome, still allows Replace */
  confirmed?: boolean;
}) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  function handleChange(fileList: FileList | null) {
    setError(null);
    setPickerOpen(false);
    const file = fileList?.[0];
    if (!file) return;
    const okType =
      ALLOWED.includes(file.type) ||
      file.type.startsWith("image/") ||
      /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
    if (!okType) {
      setError("Please choose a JPG, PNG, WebP, or HEIC photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be under 8 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    onFile(file, url);
  }

  function openPicker() {
    setError(null);
    setPickerOpen(true);
  }

  function pick(mode: PickMode) {
    setPickerOpen(false);
    // Let the sheet close before opening the system picker (iOS quirk)
    window.setTimeout(() => {
      if (mode === "library") libraryRef.current?.click();
      else if (mode === "camera") cameraRef.current?.click();
      else fileRef.current?.click();
    }, 50);
  }

  return (
    <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-4 shadow-card sm:p-5">
      <h2 className="font-display text-lg text-ink">Notebook photo</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {confirmed
          ? "Your saved plan photo. Replace it anytime to plan again for the same day."
          : "Pick from your gallery or take a new photo. English, Bangla, or mixed handwriting works."}
      </p>

      {previewUrl ? (
        <div className="relative mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview of handwritten plan"
            className="aspect-[4/5] max-h-96 w-full rounded-xl object-cover object-[center_18%] shadow-soft"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-lavender-deep shadow-card">
            {confirmed
              ? "Saved for tomorrow"
              : "✨ AI draft · Review before saving"}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-lavender-mid bg-lavender-soft/30 px-4 py-12 text-center transition hover:bg-lavender-soft/50"
        >
          <span className="font-semibold text-lavender-deep">
            Add notebook photo
          </span>
          <span className="mt-1 text-sm text-ink-muted">
            Photo Library · Camera · Files
          </span>
        </button>
      )}

      <input
        ref={libraryRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
        className="sr-only"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />

      {progress !== null ? (
        <div className="mt-3" role="status" aria-live="polite">
          <p className="text-xs text-ink-muted">Uploading… {progress}%</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lavender-soft">
            <div
              className="h-full bg-lavender transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {extracting ? (
        <p className="mt-3 text-sm text-lavender" role="status">
          Reading handwriting…
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={openPicker}>
          {previewUrl ? "Replace photo" : "Choose photo"}
        </Button>
        {previewUrl && !confirmed ? (
          <>
            <Button
              variant="ghost"
              onClick={onRetryExtract}
              disabled={extracting}
            >
              Retry extraction
            </Button>
            <Button variant="danger" onClick={onClear}>
              Clear
            </Button>
          </>
        ) : null}
      </div>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal
          aria-label="Choose photo source"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#2a2435] text-white shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
              Add notebook photo
            </p>
            <div className="flex flex-col p-2">
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/95 transition hover:bg-white/10"
                onClick={() => pick("library")}
              >
                <IconBubble>
                  <IconLibrary />
                </IconBubble>
                Photo Library
              </button>
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/95 transition hover:bg-white/10"
                onClick={() => pick("camera")}
              >
                <IconBubble>
                  <IconCamera />
                </IconBubble>
                Take photo
              </button>
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/95 transition hover:bg-white/10"
                onClick={() => pick("file")}
              >
                <IconBubble>
                  <IconFolder />
                </IconBubble>
                Choose File
              </button>
            </div>
            <button
              type="button"
              className="w-full border-t border-white/10 px-4 py-3.5 text-sm font-semibold text-white/60 transition hover:bg-white/5"
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lavender-soft"
    >
      {children}
    </span>
  );
}

function IconLibrary() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M3 16.5 8 12l4 3 3-2.5 6 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.6A1.5 1.5 0 0 1 10.9 4h2.2a1.5 1.5 0 0 1 1.2.4L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { MAX_BYTES, ALLOWED as ALLOWED_IMAGE_TYPES };
