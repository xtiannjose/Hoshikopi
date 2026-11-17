import { Suspense } from "react";

import { BaristaPicks } from "@/components/home/barista-picks";
import { Divider } from "@/components/home/divider";
import { Hero } from "@/components/home/hero";
import { PICKUP_SPACE, PickupPreview } from "@/components/home/pickup-preview";
import { PopularThisWeek } from "@/components/home/popular-this-week";
import { PrintedMenu } from "@/components/home/printed-menu";
import { StarsAndNews } from "@/components/home/stars-and-news";
import { VisitBlock } from "@/components/home/visit-block";
import { getCafeDetails, getHours, ROOM_PHOTOS } from "@/modules/cafe";
import { getEvents, getPosts } from "@/modules/content";
import { getMenu, getPricedOptions } from "@/modules/menu";
import { getPopularDrinks } from "@/modules/ordering";
import { demoMode } from "@/modules/payments";

import { YourUsual } from "./your-usual";

// Home in the order of docs/05-DESIGN-SYSTEM.md section 6 (INFO-08, NEWS-02).
export default async function Home() {
  const [cafe, hours, menu, priced, events, posts, popular] = await Promise.all(
    [
      getCafeDetails(),
      getHours(),
      getMenu(),
      getPricedOptions(),
      getEvents(),
      getPosts(),
      getPopularDrinks(),
    ]
  );
  const items = menu.flatMap((category) => category.items);
  // Only drinks still on today's menu.
  const popularItems = popular.flatMap(
    ({ menuItemId }) => items.find((item) => item.id === menuItemId) ?? []
  );
  const [windowDusk, , , tables] = ROOM_PHOTOS;
  return (
    <main id="main" className="page-width flex-1">
      <Hero
        cafe={cafe}
        hours={hours}
        photo={windowDusk}
        demo={demoMode()}
        pickup={
          <Suspense fallback={<div className={PICKUP_SPACE} />}>
            <PickupPreview />
          </Suspense>
        }
      />
      {/* A Member's usual, one tap away (audit FEAT-09). */}
      <Suspense fallback={null}>
        <YourUsual />
      </Suspense>
      <Divider />
      <BaristaPicks picks={items.filter((i) => i.picks.day)} palette="day" />
      <BaristaPicks
        picks={items.filter((i) => i.picks.night)}
        palette="night"
      />
      <PopularThisWeek items={popularItems} />
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
