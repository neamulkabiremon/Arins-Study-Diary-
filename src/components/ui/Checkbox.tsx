interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled,
}: CheckboxProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label
      htmlFor={inputId}
      className={[
        "flex min-h-11 cursor-pointer touch-manipulation items-start gap-3 py-1",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-colors sm:h-6 sm:w-6",
            checked
              ? "border-lavender bg-lavender text-white"
              : "border-lavender-mid bg-white",
          ].join(" ")}
          aria-hidden="true"
        >
          {checked ? (
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      </span>
      <span className="pt-0.5 text-[15px] leading-snug text-ink sm:text-base">
        {label}
      </span>
    </label>
  );
}
