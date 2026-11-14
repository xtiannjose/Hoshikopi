import { Suspense } from "react";

import { CartFloat } from "@/components/shell/cart-float";
import { DrawerFocus } from "@/components/shell/drawer-focus";
import { FocusOnNavigate } from "@/components/shell/focus-on-navigate";
import { Footer } from "@/components/shell/footer";
import { Header } from "@/components/shell/header";

// The customer pages' frame. Staff pages (/manage, /bar) have their own.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      {/* A Suspense boundary hydrates on its own, splitting the page's
          hydration into shorter tasks (7.6). */}
      <Suspense>
        <Footer />
      </Suspense>
      {/* Per browser, so the prerendered pages keep a hole for it. */}
      <Suspense>
        <CartFloat />
      </Suspense>
      {/* Keyboard focus for drawers and navigation (audit a11y:2, a11y:3);
          usePathname needs its own boundary under Cache Components. */}
      <DrawerFocus />
      <Suspense>
        <FocusOnNavigate />
      </Suspense>
    </>
  );
}
