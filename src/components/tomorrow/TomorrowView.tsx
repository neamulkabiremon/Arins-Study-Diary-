"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PhotoUploader } from "@/components/tomorrow/PhotoUploader";
import { TaskDraftEditor } from "@/components/tomorrow/TaskDraftEditor";
import {
  apiConfirmPlan,
  apiExtract,
  apiGetPhoto,
  apiUpload,
  hasApiBaseUrl,
} from "@/lib/api";
import { cropNotebookFocus } from "@/lib/crop-notebook";
import { formatDhakaLong } from "@/lib/dates";
import { useDiary } from "@/lib/diary-store";
import { normalizeImageForAi } from "@/lib/normalize-image";
import { isLoggedIn } from "@/lib/session";
import type { ExtractedTaskDraft } from "@/lib/types";

/** Demo-only fixtures — never used when live AI is on. */
function localExtractTasks(): ExtractedTaskDraft[] {
  return [
    {
      clientId: `extract-${Date.now()}-1`,
      title: "Solve 15 Chemistry MCQs (Ch. 4)",
      tags: ["HSC", "Medical"],
      isFrog: true,
      firstFiveMinutes: "Skim formulas for 5 minutes",
      uncertain: false,
      confidence: 0.9,
    },
    {
      clientId: `extract-${Date.now()}-2`,
      title: "Revise Biology chapter 3 notes",
      tags: ["HSC", "Medical"],
      isFrog: false,
      firstFiveMinutes: null,
      uncertain: false,
      confidence: 0.88,
    },
    {
      clientId: `extract-${Date.now()}-3`,
      title: "Chemistry short questions — set A?",
      tags: ["HSC"],
      isFrog: false,
      firstFiveMinutes: null,
      uncertain: true,
    },
  ];
}

function applyIncoming(
  incoming: ExtractedTaskDraft[],
  preserveEdits: boolean,
  mergeExtractedTasks: (tasks: ExtractedTaskDraft[]) => void,
  setDraftTasks: (tasks: ExtractedTaskDraft[]) => void,
) {
  if (preserveEdits) {
    mergeExtractedTasks(incoming);
    return;
  }
  setDraftTasks(
    incoming.map((t, i) => ({
      ...t,
      isFrog: i === 0 ? true : Boolean(t.isFrog),
    })),
  );
}

async function dataUrlToFile(dataUrl: string, name = "notebook.jpg"): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const type =
    blob.type ||
    (dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg");
  return new File([blob], name, { type, lastModified: Date.now() });
}

/** File state is lost on refresh — rebuild from preview or saved photoPath. */
async function fileFromPreviewOrPath(opts: {
  file: File | null;
  previewUrl: string | null;
  photoPath: string | null;
  canFetchPath: boolean;
}): Promise<File | null> {
  if (opts.file) return opts.file;

  if (opts.previewUrl?.startsWith("data:") || opts.previewUrl?.startsWith("blob:")) {
    try {
      return await dataUrlToFile(opts.previewUrl);
    } catch {
      /* fall through */
    }
  }

  if (opts.canFetchPath && opts.photoPath) {
    const photo = await apiGetPhoto(opts.photoPath);
    return dataUrlToFile(photo.dataUrl);
  }

  return null;
}

export function TomorrowView() {
  const {
    todayDate,
    tomorrowDate,
    tomorrowDraft,
    setDraftTasks,
    setDraftPhoto,
    setExtracting,
    setExtractError,
    mergeExtractedTasks,
    confirmTomorrowPlan,
    demoMode,
  } = useDiary();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<File | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(
    tomorrowDraft.confirmedPlan?.photoPath ?? null,
  );
  const [confirming, setConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(
    Boolean(tomorrowDraft.confirmedPlan),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  useEffect(() => {
    if (tomorrowDraft.confirmedPlan) {
      setJustConfirmed(true);
      if (tomorrowDraft.confirmedPlan.photoPath) {
        setPhotoPath(tomorrowDraft.confirmedPlan.photoPath);
      }
    }
  }, [tomorrowDraft.confirmedPlan]);

  const apiReady = !demoMode && hasApiBaseUrl();
  const useLiveApi = apiReady && signedIn;

  function rememberFile(next: File | null) {
    fileRef.current = next;
    setFile(next);
  }

  async function runExtract(sourceFile: File | null, preserveEdits: boolean) {
    setExtractError(null);
    setExtracting(true);
    setStatus(null);

    try {
      if (apiReady) {
        if (!isLoggedIn()) {
          setDraftTasks([]);
          setExtractError(
            "Sign in so AI can read your notebook photo. Demo fixtures are disabled.",
          );
          return;
        }

        const working =
          sourceFile ??
          fileRef.current ??
          (await fileFromPreviewOrPath({
            file: null,
            previewUrl: tomorrowDraft.photoPreviewUrl,
            photoPath,
            canFetchPath: useLiveApi,
          }));
        if (!working) {
          setExtractError(
            "Add a notebook photo first, then retry extraction.",
          );
          return;
        }
        rememberFile(working);

        const data = await apiExtract(working);
        applyIncoming(
          data.tasks,
          preserveEdits,
          mergeExtractedTasks,
          setDraftTasks,
        );
        setStatus(
          data.tasks.length > 0
            ? "✨ AI draft · Review each task, edit if needed, then Confirm plan."
            : "No tasks found in the photo. Add tasks manually or retry.",
        );
        return;
      }

      await new Promise((r) => setTimeout(r, 400));
      applyIncoming(
        localExtractTasks(),
        preserveEdits,
        mergeExtractedTasks,
        setDraftTasks,
      );
      setStatus("✨ AI draft · Review before saving.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      setExtractError(msg);
      setStatus("AI could not read the photo. Edit manually or retry.");
      if (!preserveEdits) setDraftTasks([]);
    } finally {
      setExtracting(false);
      setUploadProgress(null);
    }
  }

  async function onFile(f: File, _preview: string) {
    setJustConfirmed(false);
    setUploadProgress(8);
    setStatus("Preparing photo…");
    setExtractError(null);
    setDraftTasks([]);
    setPhotoPath(null);

    let working = f;
    let previewUrl = _preview;
    try {
      // HEIC/HEIF → high-quality JPEG before crop / Bedrock
      working = await normalizeImageForAi(f);
      if (working !== f) {
        URL.revokeObjectURL(_preview);
        previewUrl = URL.createObjectURL(working);
      }
      setUploadProgress(12);
      setStatus("Framing notebook…");
      try {
        const cropped = await cropNotebookFocus(working);
        working = cropped.file;
        previewUrl = cropped.previewUrl;
      } catch {
        // Keep normalized JPEG if crop fails
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not convert this photo. Try JPG or PNG.";
      setExtractError(msg);
      setUploadProgress(null);
      setStatus(null);
      return;
    }

    rememberFile(working);
    setDraftPhoto(previewUrl);
    setUploadProgress(20);
    setStatus("Reading handwriting…");

    const id = window.setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 90) {
          window.clearInterval(id);
          return p;
        }
        return p + 12;
      });
    }, 120);

    try {
      if (useLiveApi) {
        try {
          const uploaded = await apiUpload(working, tomorrowDate);
          setPhotoPath(uploaded.path);
          try {
            const photo = await apiGetPhoto(uploaded.path);
            setDraftPhoto(photo.dataUrl);
          } catch {
            /* keep cropped preview */
          }
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Photo upload failed";
          setExtractError(
            `${msg} AI can still read this session’s file; confirm may miss the saved photo.`,
          );
        }
      }
      await runExtract(working, false);
    } finally {
      window.clearInterval(id);
      setUploadProgress(null);
    }
  }

  function onClear() {
    rememberFile(null);
    setDraftPhoto(null);
    setPhotoPath(null);
    setUploadProgress(null);
    setDraftTasks([]);
    setExtractError(null);
    setStatus(null);
    setJustConfirmed(false);
  }

  async function onConfirm() {
    setConfirming(true);
    setExtractError(null);
    try {
      const taskPayload = tomorrowDraft.tasks.map((t) => ({
        title: t.title,
        tags: t.tags,
        isFrog: t.isFrog,
        firstFiveMinutes: t.firstFiveMinutes ?? null,
        uncertain: t.uncertain,
      }));

      if (useLiveApi) {
        await apiConfirmPlan({
          planDate: tomorrowDate,
          photoPath,
          tasks: taskPayload,
        });
        // Mirror onto today so /today shows Frog + checklist + photo for testing now
        await apiConfirmPlan({
          planDate: todayDate,
          photoPath,
          tasks: taskPayload,
        });
      }
      confirmTomorrowPlan();
      setJustConfirmed(true);
      setStatus(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not confirm plan";
      setExtractError(msg);
    } finally {
      setConfirming(false);
    }
  }

  const showSuccess = justConfirmed && Boolean(tomorrowDraft.confirmedPlan);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-[2rem] text-ink sm:text-4xl">
          Plan tomorrow
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted" suppressHydrationWarning>
          {formatDhakaLong(tomorrowDate)}
        </p>
      </header>

      {apiReady && !signedIn ? (
        <p className="rounded-xl border border-lavender-soft bg-lavender-soft/40 px-4 py-3 text-sm text-ink">
          Sign in once so photo upload can call AI automatically.{" "}
          <Link
            href="/login"
            className="font-semibold text-lavender-deep underline"
          >
            Go to login
          </Link>
        </p>
      ) : null}

      {showSuccess ? (
        <section
          className="animate-rise rounded-[1.35rem] border border-lavender-mid/40 bg-gradient-to-br from-lavender-soft via-[#f3ebf9] to-gold-soft/50 p-5 shadow-soft sm:p-6"
          role="status"
        >
          <p className="font-display text-2xl text-lavender-deep">
            Great work, Arin
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Your tomorrow plan is confirmed for{" "}
            <span className="font-semibold">
              {formatDhakaLong(tomorrowDate)}
            </span>
            . You&apos;ll get a soft email <strong>15 minutes before</strong> each
            timed task — check your inbox for the schedule. It&apos;s also on{" "}
            <strong>Today</strong> now so you can try Frog, checklist, and the
            notebook photo.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={onClear}>Upload again</Button>
            <Link
              href="/today"
              className="inline-flex items-center justify-center rounded-2xl bg-white/90 px-4 py-3.5 text-sm font-semibold text-lavender-deep ring-1 ring-lavender-mid/50 transition hover:bg-lavender-soft"
            >
              Open Today dashboard
            </Link>
          </div>
        </section>
      ) : null}

      <PhotoUploader
        previewUrl={tomorrowDraft.photoPreviewUrl}
        extracting={tomorrowDraft.extracting}
        progress={uploadProgress}
        confirmed={showSuccess}
        onFile={(f, preview) => void onFile(f, preview)}
        onClear={onClear}
        onRetryExtract={() => void runExtract(fileRef.current ?? file, false)}
      />

      {tomorrowDraft.extractError ? (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {tomorrowDraft.extractError} You can keep editing manually.
        </p>
      ) : null}

      {!showSuccess ? (
        <>
          <TaskDraftEditor
            tasks={tomorrowDraft.tasks}
            onChange={setDraftTasks}
          />

          {status ? (
            <p className="text-sm font-medium text-lavender-deep" role="status">
              {status}
            </p>
          ) : null}

          <Button
            fullWidth
            disabled={
              tomorrowDraft.tasks.length === 0 ||
              tomorrowDraft.extracting ||
              confirming
            }
            onClick={() => void onConfirm()}
          >
            {confirming ? "Saving…" : "Confirm plan"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
