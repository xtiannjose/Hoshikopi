import { NotFoundBody } from "@/components/not-found-body";

/** A missing page inside the site's frame; Orders have their own. */
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
