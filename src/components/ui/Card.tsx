import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: "white" | "lavender" | "soft";
  padding?: "md" | "lg";
}

const tones = {
  white: "bg-card",
  lavender: "bg-lavender-soft/80",
  soft: "bg-ivory-deep/60",
};

export function Card({
  children,
  className = "",
  tone = "white",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl shadow-card",
        tones[tone],
        padding === "lg" ? "p-5 sm:p-6" : "p-4 sm:p-5",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
