// ordering module: Orders, Order Lines, Order Codes, Order Status, Pickup Window use.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  MAX_DRINKS_PER_ORDER,
} from "./internal/rules";
export {
  nextOrderCode,
  transition,
  type Actor,
  type TransitionResult,
} from "./internal/status";
