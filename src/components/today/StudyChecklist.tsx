"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Tag } from "@/components/ui/Tag";
import { sortTasksByStartTime } from "@/lib/task-time";
import type { StudyTask } from "@/lib/types";

export function StudyChecklist({
  tasks,
  onSetCompleted,
}: {
  tasks: StudyTask[];
  onSetCompleted: (id: string, completed: boolean) => void;
}) {
  const ordered = sortTasksByStartTime(tasks);

  if (ordered.length === 0) {
    return (
      <section
        aria-labelledby="checklist-heading"
        className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card"
      >
        <h2 id="checklist-heading" className="font-display text-lg text-ink">
          Study checklist
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          No other checklist items yet. Confirm tomorrow&apos;s plan and it will
          fill this list when that day starts.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="checklist-heading"
      className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card"
    >
      <h2
        id="checklist-heading"
        className="mb-1 font-display text-lg text-ink"
      >
        Study checklist
      </h2>
      <p className="mb-4 text-xs text-ink-muted">Ordered by start time</p>
      <ul className="space-y-1">
        {ordered.map((task) => (
          <li
            key={task.id}
            className="rounded-xl px-2 py-3 transition-colors hover:bg-lavender-soft/40"
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onChange={(checked) => onSetCompleted(task.id, checked)}
              label={task.title}
            />
            {task.tags.length > 0 ? (
              <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Tag key={tag} tag={tag} />
                ))}
              </div>
            ) : null}
            {task.carriedFromDate ? (
              <p className="ml-8 mt-1 text-xs text-ink-muted">
                Carried from {task.carriedFromDate}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
