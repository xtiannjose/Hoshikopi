import Link from "next/link";

/**
 * The Concept Notice (ADR 0006): on every page and at checkout, one copy
 * (audit architecture:12). `plain` is a full page load for global-error,
 * where the router may be what broke.
 */
export function ConceptNotice({
  className = "",
  plain = false,
}: {
  className?: string;
  plain?: boolean;
}) {
  return (
    <p className={`text-muted-foreground font-mono text-sm ${className}`}>
      Hoshikopi is a concept cafe. Orders and payments here are for
      demonstration.{" "}
      {plain ? (
        <a href="/concept">About this concept</a>
      ) : (
        <Link href="/concept">About this concept</Link>
      )}
    </p>
  );
}
