"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarCropModal } from "@/components/layout/AvatarCropModal";
import { apiMe, apiUpdateAvatar, hasApiBaseUrl } from "@/lib/api";
import { useDiary } from "@/lib/diary-store";
import { isDemoMode } from "@/lib/mode";
import { setAvatarDataUrl } from "@/lib/profile";
import {
  clearSession,
  getSessionUser,
  setSession,
  getToken,
  type SessionUser,
} from "@/lib/session";

function initials(name: string, email: string) {
  const base = name.trim() || email.split("@")[0] || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function AccountMenu() {
  const router = useRouter();
  const { weekly, demoMode } = useDiary();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSessionUser();
    setUser(session);
    setAvatar(session?.avatarDataUrl ?? null);

    if (!demoMode && hasApiBaseUrl() && getToken()) {
      void apiMe()
        .then(({ user: u }) => {
          const token = getToken();
          if (!token) return;
          const next: SessionUser = {
            id: u.id,
            role: u.role,
            email: u.email,
            displayName: u.displayName,
            avatarDataUrl: u.avatarDataUrl ?? null,
          };
          setSession(token, next);
          setUser(next);
          setAvatar(u.avatarDataUrl ?? null);
          setAvatarDataUrl(u.avatarDataUrl ?? null);
        })
        .catch(() => undefined);
    }
  }, [demoMode]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const displayName =
    user?.displayName ||
    (user?.role === "emon"
      ? "Emon"
      : user
        ? "Arin Mahi"
        : demoMode
          ? "Arin Mahi"
          : "Guest");
  const email =
    user?.email ||
    (demoMode ? "demo@arins-diary.local" : "Sign in to sync");
  const balance = weekly.wallet.balance;

  async function saveCroppedAvatar(dataUrl: string) {
    setCropFile(null);
    setPhotoBusy(true);
    try {
      setAvatar(dataUrl);
      setAvatarDataUrl(dataUrl);
      if (!demoMode && hasApiBaseUrl() && getToken()) {
        const { user: u } = await apiUpdateAvatar(dataUrl);
        const token = getToken();
        if (token) {
          const next: SessionUser = {
            id: u.id,
            role: u.role,
            email: u.email,
            displayName: u.displayName,
            avatarDataUrl: u.avatarDataUrl ?? dataUrl,
          };
          setSession(token, next);
          setUser(next);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    setAvatar(null);
    setAvatarDataUrl(null);
    if (!demoMode && hasApiBaseUrl() && getToken()) {
      try {
        const { user: u } = await apiUpdateAvatar(null);
        const token = getToken();
        if (token) {
          setSession(token, {
            id: u.id,
            role: u.role,
            email: u.email,
            displayName: u.displayName,
            avatarDataUrl: null,
          });
          setUser({
            id: u.id,
            role: u.role,
            email: u.email,
            displayName: u.displayName,
            avatarDataUrl: null,
          });
        }
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex touch-manipulation items-center gap-2 rounded-full p-1 transition hover:bg-white/70"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Account menu"
      >
        <span className="hidden rounded-full bg-lavender-soft/90 px-3 py-1.5 text-xs font-bold text-lavender-deep sm:inline">
          {balance} pts
        </span>
        <span
          className={[
            "relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-lavender/50 ring-offset-2 ring-offset-ivory transition group-hover:ring-lavender sm:h-10 sm:w-10",
            open ? "ring-lavender" : "",
          ].join(" ")}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lavender to-lavender-deep text-sm font-bold text-white">
              {initials(displayName, email)}
            </span>
          )}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Account"
          className="animate-menu-pop absolute right-0 top-[calc(100%+10px)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-lavender-soft bg-[#2a2435] text-white shadow-soft"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
              Study Diary account
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="relative h-14 w-14 shrink-0 touch-manipulation overflow-hidden rounded-full ring-2 ring-lavender/60"
                onClick={() => fileRef.current?.click()}
                title="Change photo"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-lavender text-base font-bold">
                    {initials(displayName, email)}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide">
                  {photoBusy ? "…" : "Edit"}
                </span>
              </button>
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-sm text-white/65">{email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between rounded-xl bg-white/8 px-3 py-2.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  Points balance
                </p>
                <p className="mt-0.5 font-display text-2xl text-[#f8e9bc]">
                  {balance}
                  <span className="ml-1 text-sm font-sans font-semibold text-white/60">
                    pts
                  </span>
                </p>
              </div>
              <Link
                href="/rewards"
                onClick={() => setOpen(false)}
                className="rounded-full bg-lavender px-3 py-2 text-xs font-bold text-white transition hover:bg-lavender-deep"
              >
                Rewards
              </Link>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              Earned {weekly.wallet.earned} · spent {weekly.wallet.spent} ·
              synced on every device
            </p>
          </div>

          <div className="flex flex-col gap-0.5 border-t border-white/10 px-2 py-2">
            <button
              type="button"
              className="min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/90 transition hover:bg-white/10"
              onClick={() => fileRef.current?.click()}
            >
              {avatar ? "Change profile photo" : "Set profile photo"}
            </button>
            {avatar ? (
              <button
                type="button"
                className="min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10"
                onClick={() => void onRemovePhoto()}
              >
                Remove photo
              </button>
            ) : null}
            {!isDemoMode() ? (
              <button
                type="button"
                className="min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#f0b7d0] transition hover:bg-white/10"
                onClick={() => {
                  clearSession();
                  setOpen(false);
                  router.replace("/login");
                }}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (file?.type.startsWith("image/")) {
            setOpen(false);
            setCropFile(file);
          }
        }}
      />

      {cropFile ? (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(dataUrl) => void saveCroppedAvatar(dataUrl)}
        />
      ) : null}
    </div>
  );
}
