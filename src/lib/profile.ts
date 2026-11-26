const AVATAR_KEY = "arin-study-diary-avatar";

export function getAvatarDataUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setAvatarDataUrl(dataUrl: string | null) {
  if (typeof window === "undefined") return;
  if (!dataUrl) {
    localStorage.removeItem(AVATAR_KEY);
    window.dispatchEvent(new Event("arin-avatar-changed"));
    return;
  }
  localStorage.setItem(AVATAR_KEY, dataUrl);
  window.dispatchEvent(new Event("arin-avatar-changed"));
}

/** Fallback: scale-only compress (prefer AvatarCropModal for a fitted circle). */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 320;
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = max;
  canvas.height = max;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process photo");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, max, max);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
