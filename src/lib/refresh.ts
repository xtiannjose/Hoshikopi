import { revalidatePath, updateTag } from "next/cache";

/** The public pages with a slug in their address, by the tags they read. */
const SLUG_PAGES = {
  menu: ["/(site)/menu/[category]", "/(site)/menu/item/[slug]"],
  content: ["/(site)/events/[slug]", "/(site)/news/[slug]"],
  events: ["/(site)/events/[slug]"],
  hours: [
    "/(site)/menu/[category]",
    "/(site)/menu/item/[slug]",
    "/(site)/events/[slug]",
    "/(site)/news/[slug]",
  ],
} as const;

/**
 * updateTag for a Server Action that changed what the public pages show,
 * so the next visit waits for fresh data. On Next 16.4.6 that refreshed
 * /news at once but left /news/<slug> on its old copy until its one-minute
 * timer (53 s after a save, batch 12.8), so the pages with a slug in their
 * address are refreshed by their route too.
 */
export function refreshPublic(tag: keyof typeof SLUG_PAGES) {
  updateTag(tag);
  for (const route of SLUG_PAGES[tag]) revalidatePath(route, "page");
}
