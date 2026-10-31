import Link from "next/link";

// A holding page until Home is built in batch 1.4.
export default function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <h1 className="font-display max-w-3xl pt-10 pb-1 text-5xl leading-[1.1] italic md:text-7xl">
        Your kopi, ready before you get here.
      </h1>
      <p className="text-muted-foreground mt-6 max-w-[42ch] text-lg">
        Order ahead on your way in, pick up at the counter and earn a Star with
        every drink. The menu opens soon.
      </p>
      <p className="mt-8">
        <Link href="/concept">What is Hoshikopi?</Link>
      </p>
    </main>
  );
}
