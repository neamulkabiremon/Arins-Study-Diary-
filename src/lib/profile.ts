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

/** Compress image to a small JPEG data URL for local avatar storage. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 320;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process photo");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
