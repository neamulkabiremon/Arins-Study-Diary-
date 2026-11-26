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
      <section aria-labelledby="checklist-heading" className="pt-1">
        <h2
          id="checklist-heading"
          className="font-display text-lg text-ink"
        >
          Checklist
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          No other items yet — confirm tomorrow&apos;s plan and they appear when
          that day starts.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="checklist-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="checklist-heading" className="font-display text-lg text-ink">
          Checklist
        </h2>
        <p className="text-xs text-ink-muted">By start time</p>
      </div>
      <ul className="divide-y divide-lavender-soft/80 border-y border-lavender-soft/80">
        {ordered.map((task) => (
          <li key={task.id} className="py-3.5 first:pt-3 last:pb-3">
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
