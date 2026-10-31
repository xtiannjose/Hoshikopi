import { Footer } from "@/components/shell/footer";
import { Header } from "@/components/shell/header";

// The customer pages' frame. Staff pages (/manage, /bar) have their own.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
