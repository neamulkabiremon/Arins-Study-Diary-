export function CoffeeDate({ className = "h-36 w-full" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="320" height="180" rx="16" fill="#f5ebe0" />
      {/* checkered cloth */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 32}
            y={100 + row * 10}
            width="32"
            height="10"
            fill={(row + col) % 2 === 0 ? "#fff8f0" : "#e8dff0"}
          />
        )),
      )}
      {/* cups */}
      <ellipse cx="120" cy="108" rx="36" ry="10" fill="#d4c4b0" opacity="0.5" />
      <path
        d="M95 70h50l-6 40a18 18 0 0 1-38 0l-6-40z"
        fill="#fff8f0"
        stroke="#7d5ba6"
        strokeWidth="2"
      />
      <ellipse cx="120" cy="70" rx="25" ry="8" fill="#c4a574" />
      <path
        d="M112 68c2 2 6 2 8 0 2-2 4-1 6 1"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="200" cy="112" rx="36" ry="10" fill="#d4c4b0" opacity="0.5" />
      <path
        d="M175 74h50l-6 40a18 18 0 0 1-38 0l-6-40z"
        fill="#fff8f0"
        stroke="#7d5ba6"
        strokeWidth="2"
      />
      <ellipse cx="200" cy="74" rx="25" ry="8" fill="#c4a574" />
      <path
        d="M192 72c2 2 6 2 8 0 2-2 4-1 6 1"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* lavender */}
      <path d="M270 90v40" stroke="#6a8f5a" strokeWidth="2" />
      <ellipse cx="266" cy="86" rx="4" ry="6" fill="#9b7bb8" />
      <ellipse cx="274" cy="82" rx="4" ry="6" fill="#7d5ba6" />
      <ellipse cx="270" cy="74" rx="3.5" ry="5" fill="#9b7bb8" />
    </svg>
  );
}
