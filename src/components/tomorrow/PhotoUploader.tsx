"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(fileList: FileList | null) {
    setError(null);
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

  /** No `capture` — iOS/Android show the native sheet (Library / Camera / Files / Drive). */
  function openNativePicker() {
    setError(null);
    inputRef.current?.click();
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
          onClick={openNativePicker}
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
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
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
        <Button variant="secondary" onClick={openNativePicker}>
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
    </section>
  );
}

export { MAX_BYTES, ALLOWED as ALLOWED_IMAGE_TYPES };
