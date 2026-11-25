export function Frog({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="40" rx="18" ry="14" fill="#7cb86a" />
      <circle cx="22" cy="28" r="8" fill="#8fd17a" />
      <circle cx="42" cy="28" r="8" fill="#8fd17a" />
      <circle cx="22" cy="28" r="3.2" fill="#2c2438" />
      <circle cx="42" cy="28" r="3.2" fill="#2c2438" />
      <circle cx="23.2" cy="26.8" r="1" fill="#fff" />
      <circle cx="43.2" cy="26.8" r="1" fill="#fff" />
      <path
        d="M26 44c3 3 9 3 12 0"
        stroke="#2c2438"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <ellipse cx="14" cy="46" rx="5" ry="3" fill="#6a8f5a" />
      <ellipse cx="50" cy="46" rx="5" ry="3" fill="#6a8f5a" />
      {/* lily pad accent */}
      <ellipse cx="48" cy="54" rx="10" ry="4" fill="#6a8f5a" opacity="0.35" />
      <circle cx="52" cy="52" r="3" fill="#e89ab5" />
    </svg>
  );
}
