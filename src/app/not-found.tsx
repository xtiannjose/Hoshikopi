import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto grid w-full max-w-xl flex-1 content-center gap-4 px-4 py-24"
    >
      <h1 className="font-display pb-1 text-4xl italic">
        This page could not be found
      </h1>
      <p className="text-muted-foreground">
        It may have moved, or the link has a typo.
      </p>
      <p>
        <Link href="/">Back to Hoshikopi</Link>
      </p>
      <p className="text-muted-foreground font-mono text-sm">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration.
      </p>
    </main>
  );
}
