"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { getSessionUser } from "@/lib/session";
import {
  ARIN_TAGS,
  EMON_TAGS,
  type ExtractedTaskDraft,
  type TaskTag,
} from "@/lib/types";

export function TaskDraftEditor({
  tasks,
  onChange,
}: {
  tasks: ExtractedTaskDraft[];
  onChange: (tasks: ExtractedTaskDraft[]) => void;
}) {
  const role = getSessionUser()?.role ?? "arin";
  const palette: TaskTag[] = role === "emon" ? EMON_TAGS : ARIN_TAGS;
  const defaultTag: TaskTag = role === "emon" ? "Work" : "HSC";

  function update(id: string, patch: Partial<ExtractedTaskDraft>) {
    onChange(tasks.map((t) => (t.clientId === id ? { ...t, ...patch } : t)));
  }

  function setFrog(id: string) {
    onChange(
      tasks.map((t) => ({
        ...t,
        isFrog: t.clientId === id,
      })),
    );
  }

  function toggleTag(id: string, tag: TaskTag) {
    onChange(
      tasks.map((t) => {
        if (t.clientId !== id) return t;
        const has = t.tags.includes(tag);
        return {
          ...t,
          tags: has ? t.tags.filter((x) => x !== tag) : [...t.tags, tag],
        };
      }),
    );
  }

  function remove(id: string) {
    const next = tasks.filter((t) => t.clientId !== id);
    if (next.length && !next.some((t) => t.isFrog)) {
      next[0] = { ...next[0]!, isFrog: true };
    }
    onChange(next);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = tasks.findIndex((t) => t.clientId === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    const tmp = next[idx]!;
    next[idx] = next[target]!;
    next[target] = tmp;
    onChange(next);
  }

  function addManual() {
    onChange([
      ...tasks,
      {
        clientId: `manual-${Date.now()}`,
        title: role === "emon" ? "New task" : "New study task",
        tags: [defaultTag],
        isFrog: tasks.length === 0,
        firstFiveMinutes: null,
        uncertain: false,
      },
    ]);
  }

  return (
    <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-ink">Editable checklist</h2>
        <Button variant="ghost" onClick={addManual}>
          + Add task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No tasks yet. Extract from a photo or add tasks manually.
        </p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task, index) => (
            <li
              key={task.clientId}
              className="rounded-xl border border-lavender-soft bg-ivory/50 p-3"
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="frog"
                  className="mt-3 accent-lavender"
                  checked={task.isFrog}
                  onChange={() => setFrog(task.clientId)}
                  aria-label={`Set as Frog: ${task.title}`}
                />
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`title-${task.clientId}`}>
                    Task title
                  </label>
                  <input
                    id={`title-${task.clientId}`}
                    value={task.title}
                    onChange={(e) =>
                      update(task.clientId, {
                        title: e.target.value,
                        uncertain: false,
                      })
                    }
                    className="w-full rounded-lg border border-lavender-mid/50 bg-white px-3 py-2 text-sm text-ink"
                  />
                  {task.isFrog ? (
                    <p className="mt-1 text-xs font-semibold text-lavender">
                      Today&apos;s Frog (for tomorrow)
                    </p>
                  ) : null}
                  {task.uncertain ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-ink"
                      onClick={() =>
                        update(task.clientId, { uncertain: false })
                      }
                    >
                      Check handwriting
                    </button>
                  ) : null}
                  <label
                    className="mt-2 block text-xs text-ink-muted"
                    htmlFor={`five-${task.clientId}`}
                  >
                    First 5 minutes (optional)
                  </label>
                  <input
                    id={`five-${task.clientId}`}
                    value={task.firstFiveMinutes ?? ""}
                    onChange={(e) =>
                      update(task.clientId, {
                        firstFiveMinutes: e.target.value || null,
                      })
                    }
                    placeholder="Tiny first step…"
                    className="mt-1 w-full rounded-lg border border-lavender-mid/40 bg-white px-3 py-1.5 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {palette.map((tag) => {
                      const on = task.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(task.clientId, tag)}
                          className={[
                            "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase",
                            on
                              ? ""
                              : "bg-white text-ink-muted ring-1 ring-lavender-mid/40",
                          ].join(" ")}
                          aria-pressed={on}
                        >
                          {on ? <Tag tag={tag} /> : tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-lavender-soft"
                    onClick={() => move(task.clientId, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-lavender-soft"
                    onClick={() => move(task.clientId, 1)}
                    disabled={index === tasks.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    onClick={() => remove(task.clientId)}
                    aria-label="Remove task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
