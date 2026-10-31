/** The gold star mark and the wordmark in the italic serif. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <path
          d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
          className="fill-star stroke-star-edge"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display pb-0.5 leading-[1.1] italic ${size === "lg" ? "text-3xl" : "text-[1.7rem]"}`}
      >
        Hoshikopi
      </span>
    </span>
  );
}
