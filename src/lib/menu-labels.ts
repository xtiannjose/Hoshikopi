// The menu's allergen and badge keys with their labels, in one place, so
// the menu module and the Staff forms read the same table (audit
// architecture:17). Plain data, no database: client forms import it too.

export const ALLERGENS = [
  ["milk", "Milk"],
  ["egg", "Egg"],
  ["wheat", "Wheat"],
  ["soy", "Soy"],
  ["peanuts", "Peanuts"],
  ["tree_nuts", "Tree nuts"],
  ["fish", "Fish"],
  ["shellfish", "Shellfish"],
  ["sesame", "Sesame"],
] as const;

export const BADGES = [
  ["barista_pick", "Day Barista Pick"],
  ["night_pick", "Night Barista Pick"],
  ["new", "New"],
  ["best_seller", "Best seller"],
  ["vegan", "Vegan"],
  ["no_caffeine", "No caffeine"],
] as const;
