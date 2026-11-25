export function LavenderSprig({
  className = "h-10 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 78V28"
        stroke="#6a8f5a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="14" cy="58" rx="6" ry="3" fill="#6a8f5a" opacity="0.7" />
      <ellipse cx="26" cy="50" rx="6" ry="3" fill="#6a8f5a" opacity="0.7" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <ellipse
            cx={20 - (i % 2 === 0 ? 4 : -4)}
            cy={12 + i * 5}
            rx="4.5"
            ry="3"
            fill="#9b7bb8"
            opacity={0.85 - i * 0.05}
          />
        </g>
      ))}
      <ellipse cx="20" cy="8" rx="3.5" ry="4" fill="#7d5ba6" />
    </svg>
  );
}

export function LeafCorner({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 72C20 40 48 20 72 10"
        stroke="#6a8f5a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 60c12-8 22-6 28 2"
        stroke="#8fd17a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="28"
        cy="48"
        rx="10"
        ry="5"
        transform="rotate(-35 28 48)"
        fill="#6a8f5a"
        opacity="0.35"
      />
      <ellipse
        cx="48"
        cy="30"
        rx="12"
        ry="5"
        transform="rotate(-50 48 30)"
        fill="#7d5ba6"
        opacity="0.25"
      />
    </svg>
  );
}
