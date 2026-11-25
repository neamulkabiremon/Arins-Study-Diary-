"use client";

import { Frog } from "@/components/illustrations/Frog";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { StudyTask } from "@/lib/types";

export function FrogCard({
  task,
  onSetCompleted,
}: {
  task: StudyTask | null;
  onSetCompleted: (id: string, completed: boolean) => void;
}) {
  if (!task) {
    return (
      <section
        aria-labelledby="frog-heading"
        className="rounded-[1.35rem] border border-lavender-mid/30 bg-gradient-to-br from-lavender-soft to-[#e4d7f2] p-5 shadow-soft sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2.5">
          <Frog className="h-10 w-10" />
          <h2
            id="frog-heading"
            className="font-display text-lg text-lavender-deep"
          >
            Today&apos;s Frog
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          No Frog yet. Plan tomorrow and choose one hardest task to eat first.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="frog-heading"
      className="rounded-[1.35rem] border border-lavender-mid/35 bg-gradient-to-br from-[#efe6f8] via-lavender-soft to-[#e2d4f0] p-5 shadow-soft sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-card">
          <Frog className="h-9 w-9" />
        </span>
        <h2
          id="frog-heading"
          className="font-display text-lg text-lavender-deep"
        >
          Today&apos;s Frog
        </h2>
      </div>
      <p
        className={[
          "font-display text-xl leading-snug text-ink sm:text-2xl",
          task.completed ? "line-through opacity-65" : "",
        ].join(" ")}
      >
        {task.title}
      </p>
      {task.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      ) : null}
      {task.firstFiveMinutes ? (
        <p className="mt-4 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-sm leading-relaxed text-ink-muted backdrop-blur-sm">
          <span className="font-semibold text-lavender-deep">
            First 5 minutes:{" "}
          </span>
          {task.firstFiveMinutes}
        </p>
      ) : null}
      <Button
        className="mt-5 min-h-12 touch-manipulation"
        fullWidth
        variant={task.completed ? "secondary" : "primary"}
        onClick={() => onSetCompleted(task.id, !task.completed)}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <>Undo complete</>
        ) : (
          <>
            <CheckIcon />
            Mark complete
          </>
        )}
      </Button>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
