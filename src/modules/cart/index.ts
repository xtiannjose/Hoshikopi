// cart module: Carts and Lines.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  addLine,
  changeLine,
  clearCart,
  deleteMemberCart,
  pruneGuestCarts,
  getCart,
  lockCart,
  /** Tests only (audit architecture:19). */
  mergeGuestCart,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  removeLine,
  stepQuantity,
  /** Tests only (audit architecture:19). */
  updateQuantity,
  type CartLineView,
  type CartOwner,
  type CartView,
} from "./internal/cart";
export {
  favouritesFor,
  MAX_FAVOURITES,
  removeFavourite,
  saveFavourite,
  type FavouriteView,
} from "./internal/favourites";
export {
  cartOwnerForWrite,
  currentCart,
  currentCartOwner,
} from "./internal/session";
