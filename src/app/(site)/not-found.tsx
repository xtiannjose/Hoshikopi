import { NotFoundBody } from "@/components/not-found-body";

/** A missing Menu Item, Event, Post or Order, inside the site's frame. */
export default function NotFound() {
  return (
    <NotFoundBody
      links={[
        { href: "/menu", label: "See the menu" },
        { href: "/", label: "Back home" },
      ]}
    />
  );
}
