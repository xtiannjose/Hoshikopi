/**
 * A Pickup Time close to full, in words rather than colour, so a Customer
 * can pick a quieter one (audit FEAT-03). Null when there is room.
 */
export function roomHint(drinksLeft: number): string | null {
  if (drinksLeft <= 2) {
    return drinksLeft === 1 ? "1 drink left" : `${drinksLeft} drinks left`;
  }
  return drinksLeft <= 4 ? "Filling up" : null;
}
