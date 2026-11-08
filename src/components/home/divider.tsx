/** The hand-drawn wobbly line between sections (docs/05 section 6). */
export function Divider({ className = "my-16" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      className={`text-input h-6 w-full ${className}`}
    >
      <path
        d="M2 14 C 120 6, 210 20, 330 12 S 560 4, 690 13 S 920 21, 1040 11 S 1170 9, 1198 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
