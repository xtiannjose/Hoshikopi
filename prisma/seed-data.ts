// Seed data (docs/04-DATA-MODEL.md section 5). Every name, price, person and
// place here is invented for the concept and shown with the Concept Notice.
import type { PrismaClient } from "../src/generated/prisma/client";

const php = (pesos: number) => pesos * 100;
// Opening times are Manila wall-clock times in `time` columns.
const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);
const DAY = 24 * 60 * 60 * 1000;

type Group = "size" | "milk" | "sugar" | "ice" | "shots" | "addons";

const GROUPS: Record<
  Group,
  {
    name: string;
    min: number;
    max: number;
    options: [
      name: string,
      pesos: number,
      isDefault?: boolean,
      adds?: string[],
    ][];
  }
> = {
  size: {
    name: "Size",
    min: 1,
    max: 1,
    options: [
      ["Regular", 0, true],
      ["Large", 30],
    ],
  },
  milk: {
    name: "Milk",
    min: 1,
    max: 1,
    options: [
      ["Whole milk", 0, true],
      ["Oat milk", 35],
      ["Almond milk", 35, false, ["tree_nuts"]],
    ],
  },
  sugar: {
    name: "Sugar Level",
    min: 1,
    max: 1,
    options: [
      ["0%", 0],
      ["25%", 0],
      ["50%", 0],
      ["75%", 0],
      ["100%", 0, true],
    ],
  },
  ice: {
    name: "Ice Level",
    min: 1,
    max: 1,
    options: [
      ["Less", 0],
      ["Normal", 0, true],
      ["Extra", 0],
    ],
  },
  shots: {
    name: "Extra Shots",
    min: 0,
    max: 1,
    options: [
      ["1 extra shot", 35],
      ["2 extra shots", 70],
    ],
  },
  addons: {
    name: "Add-ons",
    min: 0,
    max: 2,
    options: [
      ["Sea-salt cream", 30, false, ["milk"]],
      ["Sago", 20],
    ],
  },
};

const MILK_DRINK: Group[] = ["size", "milk", "sugar", "ice", "shots", "addons"];

const CATEGORIES: {
  slug: string;
  name: string;
  isDrink: boolean;
  items: {
    slug: string;
    name: string;
    pesos: number;
    description: string;
    allergens?: string[];
    badges?: string[];
    groups?: Group[];
  }[];
}[] = [
  {
    slug: "coffee",
    name: "Coffee",
    isDrink: true,
    items: [
      {
        slug: "kopi-hitam",
        name: "Kopi Hitam",
        pesos: 120,
        description:
          "Black coffee from our house blend. Strong, clean, no fuss.",
        badges: ["vegan"],
        groups: ["size", "sugar", "shots"],
      },
      {
        slug: "hoshi-latte",
        name: "Hoshi Latte",
        pesos: 185,
        description:
          "Our signature: espresso, muscovado and milk under a cap of sea-salt cream.",
        allergens: ["milk"],
        badges: ["barista_pick", "best_seller"],
        groups: MILK_DRINK,
      },
      {
        slug: "spanish-latte",
        name: "Spanish Latte",
        pesos: 165,
        description: "Espresso with milk and a ribbon of condensed milk.",
        allergens: ["milk"],
        badges: ["best_seller"],
        groups: MILK_DRINK,
      },
      {
        slug: "ube-latte",
        name: "Ube Latte",
        pesos: 180,
        description:
          "Espresso over ube halaya milk. Purple, nutty, not too sweet.",
        allergens: ["milk"],
        badges: ["new"],
        groups: MILK_DRINK,
      },
      {
        slug: "cafe-mocha",
        name: "Cafe Mocha",
        pesos: 175,
        description: "Espresso, Davao chocolate and steamed milk.",
        badges: ["night_pick"],
        allergens: ["milk", "soy"],
        groups: MILK_DRINK,
      },
      {
        slug: "cold-brew",
        name: "Cold Brew",
        pesos: 150,
        description:
          "Steeped for 18 hours. Smooth and bright, served over ice.",
        badges: ["vegan"],
        groups: ["size", "sugar", "ice", "addons"],
      },
    ],
  },
  {
    slug: "non-coffee",
    name: "Non-coffee",
    isDrink: true,
    items: [
      {
        slug: "matcha-latte",
        name: "Matcha Latte",
        pesos: 175,
        description: "Ceremonial-grade matcha whisked into milk.",
        allergens: ["milk"],
        groups: ["size", "milk", "sugar", "ice", "addons"],
      },
      {
        slug: "tablea-tsokolate",
        name: "Tablea Tsokolate",
        pesos: 160,
        description:
          "Thick hot chocolate from Batangas tablea, beaten the old way.",
        allergens: ["milk"],
        badges: ["barista_pick"],
        groups: ["size", "milk", "sugar"],
      },
      {
        slug: "calamansi-honey-soda",
        name: "Calamansi Honey Soda",
        pesos: 120,
        description:
          "Fresh calamansi, wild honey and soda. Sour, sweet, fizzy.",
        badges: ["no_caffeine"],
        groups: ["size", "sugar", "ice", "addons"],
      },
    ],
  },
  {
    slug: "tea",
    name: "Tea",
    isDrink: true,
    items: [
      {
        slug: "barako-chai",
        name: "Barako Chai",
        pesos: 150,
        description: "Spiced black tea with a shot of barako. Warm and bold.",
        allergens: ["milk"],
        groups: ["size", "milk", "sugar", "ice"],
      },
      {
        slug: "tanglad-ginger-tea",
        name: "Tanglad Ginger Tea",
        pesos: 120,
        description:
          "Lemongrass and ginger, brewed fresh. Good for rainy days.",
        badges: ["vegan", "no_caffeine", "night_pick"],
        groups: ["size", "sugar"],
      },
    ],
  },
  {
    slug: "pastries",
    name: "Pastries",
    isDrink: false,
    items: [
      {
        slug: "ube-pandesal",
        name: "Ube Pandesal",
        pesos: 75,
        description: "Soft purple pandesal with a melty cheese centre.",
        allergens: ["wheat", "milk", "egg"],
        badges: ["barista_pick"],
      },
      {
        slug: "ensaymada",
        name: "Ensaymada",
        pesos: 95,
        description:
          "Buttery brioche coil with sugar and grated queso de bola.",
        allergens: ["wheat", "milk", "egg"],
      },
      {
        slug: "butter-croissant",
        name: "Butter Croissant",
        pesos: 110,
        description: "Laminated by hand, baked every morning.",
        allergens: ["wheat", "milk", "egg"],
      },
      {
        slug: "banana-bread",
        name: "Banana Bread slice",
        pesos: 90,
        description: "Lakatan banana bread with toasted walnuts.",
        badges: ["night_pick"],
        allergens: ["wheat", "milk", "egg", "tree_nuts"],
      },
    ],
  },
  {
    slug: "all-day-food",
    name: "All-day food",
    isDrink: false,
    items: [
      {
        slug: "tapa-rice-bowl",
        name: "Tapa Rice Bowl",
        pesos: 260,
        description: "Beef tapa, garlic rice, a soft egg and pickled papaya.",
        allergens: ["soy", "egg"],
      },
      {
        slug: "longganisa-pandesal",
        name: "Longganisa Pandesal Sandwich",
        pesos: 195,
        description:
          "Sweet longganisa patty, kesong puti and atchara in pandesal.",
        allergens: ["wheat", "soy", "milk"],
      },
    ],
  },
  {
    slug: "beans-and-merch",
    name: "Beans and merch",
    isDrink: false,
    items: [
      {
        slug: "house-blend-250g",
        name: "House Blend 250 g",
        pesos: 520,
        description:
          "Whole beans: Benguet arabica with a little Batangas barako.",
      },
      {
        slug: "hoshikopi-tumbler",
        name: "Hoshikopi Tumbler",
        pesos: 650,
        description: "Keeps it cold for a day, hot for a morning. 16 oz.",
      },
    ],
  },
];

// Alt text for each Menu Item's concept image (ADR 0012), written as a menu
// describes the item; the prompts that make the pictures are in docs/ASSETS.md.
const PHOTO_ALT: Record<string, string> = {
  "kopi-hitam": "Black coffee in a cream cup on a wooden counter",
  "hoshi-latte":
    "Iced Hoshi Latte with a white cap of sea-salt cream over espresso and milk",
  "spanish-latte":
    "Iced Spanish latte with a layer of milk over espresso and condensed milk",
  "ube-latte": "Iced ube latte, purple milk with espresso poured on top",
  "cafe-mocha": "Hot cafe mocha with a dusting of cocoa in a cream cup",
  "cold-brew": "Cold brew over large ice cubes in a tall glass",
  "matcha-latte": "Iced matcha latte, green over white milk in a glass",
  "tablea-tsokolate":
    "Thick hot chocolate in a small clay cup next to a round tablea disc",
  "calamansi-honey-soda":
    "Calamansi honey soda with halved calamansi and ice in a tall glass",
  "barako-chai": "Barako chai with milk in a cream cup, cinnamon on the side",
  "tanglad-ginger-tea":
    "Golden lemongrass and ginger tea in a glass cup with a lemongrass stalk",
  "ube-pandesal":
    "Three purple ube pandesal rolls, one torn open to show cheese",
  ensaymada: "Coiled ensaymada topped with sugar and grated cheese",
  "butter-croissant": "Golden butter croissant on a cream plate",
  "banana-bread": "Thick slice of banana bread with walnuts",
  "tapa-rice-bowl":
    "Beef tapa over garlic rice with a soft egg and pickled papaya",
  "longganisa-pandesal":
    "Longganisa patty sandwich in pandesal with white cheese and atchara",
  "house-blend-250g": "Kraft bag of whole coffee beans with a gold star label",
  "hoshikopi-tumbler": "Night-blue tumbler with a small gold star",
};

const SPACE_MD = `A narrow room with 28 seats: a long window bar for laptops, four small tables and a bench by the door for the dogs. By day the light comes in off the street and the walls look like cream paper. After six the lamps come down low and the ceiling shows a painted night sky.`;

const DIRECTIONS_MD = `We are in Kapitolyo, Pasig, a short walk from Capitol Commons. From Shaw Boulevard, take a jeep or a tricycle to Kapitolyo and walk in. The pin on the map sits on a public spot nearby.`;

const STORY_MD = `Hoshikopi began as a coffee cart outside a friend's office in Ortigas. The name joins hoshi, Japanese for star, with kopi, the Malay word for coffee, close to our own kape.

**A note from Lia, our founder** (an invented person): "I wanted a place that is bright for your morning and quiet for your night, and a cup that is ready when you walk in."

Our beans come from farms in Benguet and Sagada, with a little barako from Batangas for body.

The team: Lia (founder), Annika (head barista) and Christian (manager). Every person named here is invented for this concept.`;

const PAIRINGS: [string, string][] = [
  ["kopi-hitam", "banana-bread"],
  ["hoshi-latte", "ube-pandesal"],
  ["spanish-latte", "ensaymada"],
  ["ube-latte", "ube-pandesal"],
  ["cafe-mocha", "banana-bread"],
  ["cold-brew", "butter-croissant"],
  ["matcha-latte", "butter-croissant"],
  ["tablea-tsokolate", "ensaymada"],
  ["calamansi-honey-soda", "tapa-rice-bowl"],
  ["barako-chai", "banana-bread"],
  ["tanglad-ginger-tea", "ensaymada"],
  ["ube-pandesal", "hoshi-latte"],
  ["ensaymada", "tablea-tsokolate"],
  ["butter-croissant", "kopi-hitam"],
  ["banana-bread", "cold-brew"],
  ["tapa-rice-bowl", "calamansi-honey-soda"],
  ["longganisa-pandesal", "kopi-hitam"],
];

export async function seedDatabase(
  db: PrismaClient,
  { people = true } = {}
): Promise<void> {
  const groupIds = {} as Record<Group, string>;
  for (const [index, [key, group]] of Object.entries(GROUPS).entries()) {
    const created = await db.optionGroup.create({
      data: {
        name: group.name,
        minSelect: group.min,
        maxSelect: group.max,
        sort: index,
        options: {
          create: group.options.map(([name, pesos, isDefault, adds], sort) => ({
            name,
            deltaCents: php(pesos),
            isDefault: isDefault ?? false,
            addsAllergens: adds ?? [],
            sort,
          })),
        },
      },
    });
    groupIds[key as Group] = created.id;
  }

  for (const [sort, category] of CATEGORIES.entries()) {
    await db.category.create({
      data: {
        slug: category.slug,
        name: category.name,
        sort,
        items: {
          create: category.items.map((item, itemSort) => ({
            slug: item.slug,
            name: item.name,
            description: item.description,
            baseCents: php(item.pesos),
            isDrink: category.isDrink,
            badges: item.badges ?? [],
            allergens: item.allergens ?? [],
            photoAlt: PHOTO_ALT[item.slug],
            sort: itemSort,
            optionGroups: {
              create: (item.groups ?? []).map((group, groupSort) => ({
                optionGroupId: groupIds[group],
                sort: groupSort,
              })),
            },
          })),
        },
      },
    });
  }

  // "Goes well with" (MENU-08): each drink with a bite, each bite with a drink.
  for (const [slug, pairSlug] of PAIRINGS) {
    const pair = await db.menuItem.findUniqueOrThrow({
      where: { slug: pairSlug },
    });
    await db.menuItem.update({ where: { slug }, data: { pairingId: pair.id } });
  }

  for (let weekday = 0; weekday < 7; weekday++) {
    await db.openingHours.create({
      data: {
        weekday,
        opensAt: time("07:00"),
        lastOrderAt: time("20:30"),
        closesAt: time("21:00"),
      },
    });
    await db.capacityRule.create({
      data: { weekday, drinksPerWindow: 12, foodPerWindow: 8 },
    });
  }

  await db.cafeSettings.create({
    data: {
      prepBaseMinutes: 4,
      prepPerDrinkMinutes: 1.5,
      orderCodePrefix: "K",
      area: "Kapitolyo, Pasig",
      // A public spot (Capitol Commons park), never a home (PRD section 2).
      mapLat: 14.5753,
      mapLng: 121.062,
      directionsMd: DIRECTIONS_MD,
      contactEmail: "hello@hoshikopi.example",
      spaceMd: SPACE_MD,
      storyMd: STORY_MD,
      wifi: true,
      powerOutlets: true,
      petsAllowed: true,
      smokingAllowed: false,
      restroom: true,
      stepFreeEntrance: true,
      accessibleRestroom: false,
      laptopNote: "Outlets along the window bar. Laptops welcome all day.",
      petsNote: "Leashed dogs are welcome on the bench by the door.",
      parkingNote:
        "Street parking is tight. The nearest car park is at Capitol Commons, about 6 minutes on foot.",
    },
  });

  // Events start at 7 PM Manila time (11:00 UTC) a week and three weeks out.
  const evening = (daysAhead: number) => {
    const day = new Date(Date.now() + daysAhead * DAY);
    day.setUTCHours(11, 0, 0, 0);
    return day;
  };
  await db.event.createMany({
    data: [
      {
        slug: "latte-art-night",
        title: "Latte art night",
        startsAt: evening(7),
        endsAt: new Date(evening(7).getTime() + 2 * 60 * 60 * 1000),
        summary: "Pour your first rosetta with Annika. Milk and cups on us.",
        bodyMd:
          "Bring a friend and learn the basics of milk texture and pouring. We start with hearts and work up to a rosetta. Eight seats at the bar.",
        priceCents: php(350),
        isPublished: true,
      },
      {
        slug: "open-mic-under-the-stars",
        title: "Open mic under the stars",
        startsAt: evening(21),
        endsAt: new Date(evening(21).getTime() + 3 * 60 * 60 * 1000),
        summary:
          "Songs, poems and stand-up. Sign up at the counter on the night.",
        bodyMd:
          "Five minutes each, acoustic only. The kitchen stays open until 8:30 PM and the night sky ceiling stays on.",
        isPublished: true,
      },
    ],
  });

  const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
  await db.post.createMany({
    data: [
      {
        slug: "how-we-make-the-hoshi-latte",
        title: "How we make the Hoshi Latte",
        excerpt:
          "Muscovado, a double shot and sea-salt cream: the three steps behind our signature drink.",
        bodyMd:
          "We melt muscovado into the espresso so it tastes of caramel, not sugar. Then cold milk, then a cap of cream whipped with a pinch of sea salt. Sip it without stirring: salt first, then sweet, then coffee.",
        publishedAt: daysAgo(3),
      },
      {
        slug: "our-beans-from-benguet",
        title: "Our beans from Benguet",
        excerpt: "Why our house blend starts in the Cordillera highlands.",
        bodyMd:
          "Arabica from Benguet grows slowly in cool air, which gives it a sweet, clean cup. We add a little Batangas barako for body. The farms and the blend are invented for this concept.",
        publishedAt: daysAgo(10),
      },
      {
        slug: "order-ahead-skip-the-line",
        title: "Order ahead and skip the line",
        excerpt:
          "Pick a Pickup Time, pay with GCash, Maya or at the counter, and walk straight to the bar.",
        bodyMd:
          "Choose As Soon As Possible or a 15-minute Pickup Window later today. We only offer windows we can make in time, so the time we show is the time it is ready.",
        publishedAt: daysAgo(20),
      },
    ],
  });

  if (!people) return;
  await db.user.createMany({
    data: [
      {
        id: "seed-manager",
        name: "Christian",
        email: "christian@hoshikopi.example",
        emailVerified: true,
        role: "manager",
      },
      {
        id: "seed-barista",
        name: "Annika",
        email: "annika@hoshikopi.example",
        emailVerified: true,
        role: "barista",
      },
      {
        id: "seed-member",
        name: "Hoshi",
        email: "hoshi@hoshikopi.example",
        emailVerified: true,
      },
    ],
  });
}
