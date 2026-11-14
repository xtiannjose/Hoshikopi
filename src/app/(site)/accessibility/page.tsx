import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ListChecksIcon,
  TargetIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { getCafeContact } from "@/modules/cafe";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "What Hoshikopi aims for so everyone can order, how we check it, and what still falls short.",
};

// The known gaps come from the audit backlog (docs/audit/2026-11-13.md,
// a11y:5, 7, 8 and 11); take a line out when its fix ships.
const SECTIONS: {
  id: string;
  title: string;
  icon: ReactNode;
  points: ReactNode[];
}[] = [
  {
    id: "what-we-aim-for",
    title: "What we aim for",
    icon: <TargetIcon size={20} />,
    points: [
      "WCAG 2.2 at level AA, in both the Day and the Night palette.",
      "Everything works with a keyboard alone, and focus stays visible: never under a sticky bar, never lost when a drawer opens or a page changes.",
      "Pages fit a phone 320 px wide and zoom to 400% without scrolling sideways.",
      "If your device asks for less motion, pages stop fading and sliding, and Add to order still shows Added.",
    ],
  },
  {
    id: "how-we-check",
    title: "How we check",
    icon: <ListChecksIcon size={20} />,
    points: [
      "Automated axe checks run on the pages people use most and on the Staff screens, in both palettes, at phone and desktop sizes.",
      "Keyboard tests walk through the menu, a drink's Options and the Cart, and a refused form takes focus to the field to fix.",
      "Lighthouse gives Home, the menu and a drink's page an accessibility score of 100.",
      "We also try pages by hand with a keyboard and a screen reader.",
    ],
  },
  {
    id: "what-still-falls-short",
    title: "What still falls short",
    icon: <WarningCircleIcon size={20} />,
    points: [
      "Some buttons lose keyboard focus for a moment while they work, for example Place order.",
      "Placeholder text in the Day palette is lighter than the contrast we aim for.",
      "With a larger default text size (not zoom), the phone header can push the Cart and menu buttons off screen.",
      "At checkout, the note that an email or a mobile number is enough is not tied to either field.",
    ],
  },
];

export default async function AccessibilityPage() {
  const { contactEmail } = await getCafeContact();
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-5xl">
        <PageHeader
          eyebrow="Updated Nov 2026"
          title="Accessibility"
          intro="We want everyone to be able to order a kopi here. Hoshikopi is a concept cafe, so this covers the website."
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
          Something stopping you? Email{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and tell us the
          page and what happened.
        </p>
      </div>
    </main>
  );
}
