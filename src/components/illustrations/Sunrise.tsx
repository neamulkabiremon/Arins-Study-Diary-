export function SunriseBanner({ className = "h-full w-28" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMaxYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7d9b8" />
          <stop offset="55%" stopColor="#e8dff0" />
          <stop offset="100%" stopColor="#c4b0d9" />
        </linearGradient>
      </defs>
      <rect width="120" height="64" fill="url(#sky)" />
      <circle cx="78" cy="34" r="16" fill="#f0c27a" opacity="0.9" />
      <path
        d="M0 48c20-10 40-6 60 2 20 8 40 6 60-4v18H0V48z"
        fill="#fff8f0"
        opacity="0.7"
      />
    </svg>
  );
}
