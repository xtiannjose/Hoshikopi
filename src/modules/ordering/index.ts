// ordering module: Orders, Order Lines, Order Codes, Order Status, Pickup Window use.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  MAX_DRINKS_PER_ORDER,
} from "./internal/rules";
export { nextOrderCode, transition, type Actor } from "./internal/status";
export {
  placeOrder,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "./internal/place";
export {
  checkoutView,
  dayOrders,
  deidentifyOrders,
  getOrderBrief,
  getOrderForCustomer,
  ordersForExport,
  ordersForMember,
  type OrderView,
} from "./internal/reads";
export { orderAgain } from "./internal/again";
export {
  getPopularDrinks,
  popularDrinks,
  salesReport,
} from "./internal/reports";
export {
  advanceInDemo,
  cancelByCustomer,
  orderVersion,
} from "./internal/customer";
export { orderLink } from "./internal/links";
export { barBoard, expireUnpaid } from "./internal/bar";
export { receivePaymentWebhook } from "./internal/webhook";
export { cancelOrder, refundOrder } from "./internal/refund";
