import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ClockIcon,
  DatabaseIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/ssr";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { getCafeContact } from "@/modules/cafe";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Hoshikopi keeps about you, why, for how long, and how to get it or delete it.",
};

const SECTIONS: {
  id: string;
  title: string;
  icon: ReactNode;
  points: ReactNode[];
}[] = [
  {
    id: "what-we-keep",
    title: "What we keep",
    icon: <DatabaseIcon size={20} />,
    points: [
      "For an Order: your name, and an email or a mobile number so we can reach you about it.",
      "For an account: your email, your name if you give it, your Orders and your Star history.",
      "Nothing about cards or wallets: payments happen on the payment page, not here.",
    ],
  },
  {
    id: "why",
    title: "Why",
    icon: <HeartIcon size={20} />,
    points: [
      "To make your Order, tell you when it's ready and, for Members, count your Stars.",
      "We send offers only if you tick the box for them in your account. You can untick it any time.",
    ],
  },
  {
    id: "how-long",
    title: "How long",
    icon: <ClockIcon size={20} />,
    points: [
      "Your account stays until you delete it.",
      "Orders stay as the cafe's records. If you delete your account, they stay without your name, email or phone.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    icon: <ShieldCheckIcon size={20} />,
    points: [
      "Under the Data Privacy Act of 2012 you may see, correct, download and delete your data.",
      <>
        In your account: <Link href="/account#details">Your details</Link> to
        correct,{" "}
        <a href="/api/account/export" download>
          Download my data
        </a>
        , and <Link href="/account#details">Delete my account</Link>.
      </>,
    ],
  },
];

export default async function PrivacyPage() {
  const { contactEmail } = await getCafeContact();
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-5xl">
        <PageHeader
          eyebrow="Updated Nov 2026"
          title="Privacy"
          intro="Hoshikopi is a concept cafe, so no real orders are made and no real money moves. Accounts and emails here are still real, so we treat them with care."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {SECTIONS.map(({ id, title, icon, points }) => (
            <Panel key={id} id={id} title={title} icon={icon}>
              <ul className="grid list-disc gap-2 pl-5">
                {points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
        <p className="max-w-measure mt-10">
          Questions? Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          . You can manage your data in{" "}
          <Link href="/account">your account</Link>.
        </p>
      </div>
    </main>
  );
}
