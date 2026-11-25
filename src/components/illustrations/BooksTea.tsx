export function BooksTea({ className = "h-28 w-36" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="12" y="78" width="70" height="14" rx="2" fill="#7d5ba6" />
      <rect x="18" y="64" width="70" height="14" rx="2" fill="#9b7bb8" />
      <rect x="24" y="50" width="70" height="14" rx="2" fill="#c4b0d9" />
      <ellipse cx="120" cy="88" rx="28" ry="8" fill="#e8dff0" />
      <path
        d="M100 70h36a4 4 0 0 1 4 4v14a8 8 0 0 1-8 8h-28a8 8 0 0 1-8-8V74a4 4 0 0 1 4-4z"
        fill="#fff8f0"
        stroke="#7d5ba6"
        strokeWidth="2"
      />
      <path
        d="M140 78h8a10 10 0 0 1 0 20h-4"
        stroke="#7d5ba6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M112 58c0-6 4-10 4-14M124 56c0-5 3-8 3-12"
        stroke="#c4b0d9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
