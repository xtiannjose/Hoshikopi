import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Hoshikopi keeps about you, why, for how long, and how to get it or delete it.",
};

const SECTIONS: [string, string[]][] = [
  [
    "What we keep",
    [
      "For an Order: your name, and an email or a mobile number so we can reach you about it.",
      "For an account: your email, your name if you give it, your Orders and your Star history.",
      "Nothing about cards or wallets: payments happen on the payment page, not here.",
    ],
  ],
  [
    "Why",
    [
      "To make your Order, tell you when it's ready and, for Members, count your Stars.",
      "We send offers only if you tick the box for them in your account. You can untick it any time.",
    ],
  ],
  [
    "How long",
    [
      "Your account stays until you delete it.",
      "Orders stay as the cafe's records. If you delete your account, they stay without your name, email or phone.",
    ],
  ],
  [
    "Your rights",
    [
      "Under the Data Privacy Act of 2012 you may see, correct, download and delete your data.",
      "In your account: Your details to correct, Download my data, and Delete my account.",
    ],
  ],
];

export default function PrivacyPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 md:px-8"
    >
      <h1 className="font-display pb-1 text-5xl italic">Privacy</h1>
      <p className="mt-4 text-lg">
        Hoshikopi is a concept cafe, so no real orders are made and no real
        money moves. Accounts and emails here are still real, so we treat them
        with care.
      </p>
      {SECTIONS.map(([title, points]) => (
        <section key={title} className="mt-10">
          <h2 className="font-display pb-1 text-3xl italic">{title}</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-10">
        Questions? Email the address at the bottom of this page. You can manage
        your data in <Link href="/account">your account</Link>.
      </p>
    </main>
  );
}
