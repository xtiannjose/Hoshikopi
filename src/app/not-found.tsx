import type { Metadata } from "next";

import { NotFoundBody } from "@/components/not-found-body";
import { Footer } from "@/components/shell/footer";
import { Header } from "@/components/shell/header";

export const metadata: Metadata = { title: "Page not found" };

/** An address no page has: the customer frame, so the way on is the usual
 * one (and the Concept Notice is in the footer). */
export default function NotFound() {
  return (
    <>
      <Header />
      <NotFoundBody
        links={[
          { href: "/menu", label: "See the menu" },
          { href: "/", label: "Back home" },
        ]}
      />
      <Footer />
    </>
  );
}
