import { NotFoundBody } from "@/components/not-found-body";

/**
 * A wrong, cut or token-less Order link: how to find the Order (audit
 * journeys:18). It stays 200, as notFound() runs after the page has
 * streamed; Next marks it noindex.
 */
export default function NotFound() {
  return (
    <NotFoundBody
      title="We couldn't open this order"
      intro="The link may be cut short. Use the full link you got when you ordered, or sign in to see Your orders."
      links={[
        { href: "/account#orders", label: "Your orders" },
        { href: "/menu", label: "See the menu" },
      ]}
    />
  );
}
