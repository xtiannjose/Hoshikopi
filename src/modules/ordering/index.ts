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
export {
  normalizePhone,
  placeOrder,
  type Pickup,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "./internal/place";
export {
  checkoutView,
  dayOrders,
  getOrderBrief,
  getOrderForCustomer,
  type CheckoutView,
  type OrderView,
} from "./internal/reads";
export { cancelByCustomer, orderVersion } from "./internal/customer";
export { orderLink, tokenMatches } from "./internal/links";
export {
  barBoard,
  expireUnpaid,
  type BarBoard,
  type BarOrder,
} from "./internal/bar";
export {
  receivePaymentWebhook,
  type WebhookResponse,
} from "./internal/webhook";
export { cancelOrder, refundOrder, type RefundResult } from "./internal/refund";
