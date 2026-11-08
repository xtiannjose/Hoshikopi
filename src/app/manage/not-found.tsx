import { NotFoundBody } from "@/components/not-found-body";

/** A Menu Item, Event or Post that is gone, inside the Staff frame. */
export default function NotFound() {
  return (
    <NotFoundBody links={[{ href: "/manage", label: "Back to Manage" }]} />
  );
}
