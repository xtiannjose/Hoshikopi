/** An Order holds at most this many drinks (ORD-12). */
export const MAX_DRINKS_PER_ORDER = 15;

/**
 * The most one Order can hold today: an Order is made in one Pickup Window,
 * so never more than a window's Capacity, and never over 15 drinks (audit
 * journeys:3). Bigger orders go through an Inquiry.
 */
export function orderLimit(capacity: { drinks: number; food: number }) {
  return {
    drinks: Math.min(MAX_DRINKS_PER_ORDER, capacity.drinks),
    food: capacity.food,
  };
}

/** Whether a Cart fits one Order today. */
export const fitsOneOrder = (
  cart: { drinks: number; foodLines: number },
  limit: { drinks: number; food: number }
) => cart.drinks <= limit.drinks && cart.foodLines <= limit.food;

/** A Guest may Pay at Pickup for up to this many drinks (PAY-02). */
export const GUEST_PAY_AT_PICKUP_MAX_DRINKS = 4;
