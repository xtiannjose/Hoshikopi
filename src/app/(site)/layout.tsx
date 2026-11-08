import { Suspense } from "react";

import { CartFloat } from "@/components/shell/cart-float";
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
    </>
  );
}
