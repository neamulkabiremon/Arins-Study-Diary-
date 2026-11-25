import type { TaskTag } from "@/lib/types";

const styles: Record<TaskTag, string> = {
  HSC: "bg-leaf-soft text-leaf",
  Medical: "bg-lavender-soft text-lavender-deep",
  Engineering: "bg-gold-soft text-ink",
};

export function Tag({ tag }: { tag: TaskTag }) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        styles[tag],
      ].join(" ")}
    >
      {tag}
    </span>
  );
}
