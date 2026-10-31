// Concept images of the room (ADR 0012, docs/ASSETS.md). Set `src` to
// "/room/<name>.webp" once a picture is made; until then a stand-in shows.
export type RoomPhoto = {
  name: string;
  src: string | null;
  alt: string;
  caption: string;
};

export const ROOM_PHOTOS: RoomPhoto[] = [
  {
    name: "window-dusk",
    src: null,
    alt: "The long window bar at dusk with two cups and a laptop, warm lamps inside",
    caption: "Concept image: the window bar at dusk",
  },
  {
    name: "counter-morning",
    src: null,
    alt: "A barista's hands pouring milk into a cream cup at the counter",
    caption: "Concept image: the counter in the morning",
  },
  {
    name: "night-ceiling",
    src: null,
    alt: "The room after six with low lamps and a ceiling painted as a night sky",
    caption: "Concept image: the room after six",
  },
  {
    name: "tables",
    src: null,
    alt: "Four small walnut tables with cups and pastries in daylight",
    caption: "Concept image: the tables by day",
  },
  {
    name: "bench",
    src: null,
    alt: "A dog resting under the wooden bench by the door",
    caption: "Concept image: the bench by the door",
  },
];
