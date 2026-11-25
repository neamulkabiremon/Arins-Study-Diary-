import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-lavender text-white hover:bg-lavender-deep active:scale-[0.99] shadow-soft disabled:opacity-50",
  secondary:
    "bg-white/90 text-lavender-deep ring-1 ring-lavender-mid/50 hover:bg-lavender-soft disabled:opacity-50",
  ghost:
    "bg-transparent text-ink-muted hover:bg-lavender-soft/70 disabled:opacity-50",
  danger: "bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200",
        "disabled:cursor-not-allowed",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
