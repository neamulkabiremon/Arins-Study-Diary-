import type { TaskTag } from "@/lib/types";

const styles: Record<TaskTag, string> = {
  HSC: "bg-leaf-soft text-leaf",
  Medical: "bg-lavender-soft text-lavender-deep",
  Engineering: "bg-gold-soft text-ink",
  Work: "bg-lavender-soft text-lavender-deep",
  Gym: "bg-leaf-soft text-leaf",
  Language: "bg-[#efe6f8] text-lavender-deep",
  Reading: "bg-gold-soft text-ink",
  Personal: "bg-ivory text-ink-muted ring-1 ring-lavender-soft",
};

export function Tag({ tag }: { tag: TaskTag }) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[tag] ?? "bg-lavender-soft text-lavender-deep",
      ].join(" ")}
    >
      {tag}
    </span>
  );
}
