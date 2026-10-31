import { BaristaPicks } from "@/components/home/barista-picks";
import { Divider } from "@/components/home/divider";
import { Hero } from "@/components/home/hero";
import { PrintedMenu } from "@/components/home/printed-menu";
import { StarsAndNews } from "@/components/home/stars-and-news";
import { VisitBlock } from "@/components/home/visit-block";
import { getCafeDetails, getHours, ROOM_PHOTOS } from "@/modules/cafe";
import { getEvents, getPosts } from "@/modules/content";
import { getMenu, getPricedOptions } from "@/modules/menu";

// Home in the order of docs/05-DESIGN-SYSTEM.md section 6 (INFO-08, NEWS-02).
export default async function Home() {
  const [cafe, hours, menu, priced, events, posts] = await Promise.all([
    getCafeDetails(),
    getHours(),
    getMenu(),
    getPricedOptions(),
    getEvents(),
    getPosts(),
  ]);
  const picks = menu
    .flatMap((category) => category.items)
    .filter((item) => item.badges.includes("Barista Pick"));
  const [windowDusk, , , tables] = ROOM_PHOTOS;
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <Hero cafe={cafe} hours={hours} photo={windowDusk} />
      <Divider />
      <BaristaPicks picks={picks} />
      <div className="mt-24">
        <PrintedMenu menu={menu} priced={priced} />
      </div>
      <div className="mt-24">
        <StarsAndNews
          event={events.upcoming[0] ?? null}
          post={posts[0] ?? null}
        />
      </div>
      <Divider />
      <VisitBlock cafe={cafe} hours={hours} photo={tables} />
    </main>
  );
}
