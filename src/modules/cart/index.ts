// cart module: Carts and Lines.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  addLine,
  clearCart,
  deleteMemberCart,
  getCart,
  mergeGuestCart,
  MAX_LINE_QUANTITY,
  MAX_NOTE_LENGTH,
  removeLine,
  updateQuantity,
  type AddResult,
  type CartLineView,
  type CartOwner,
  type CartView,
  type NewLine,
} from "./internal/cart";
export {
  favouritesFor,
  removeFavourite,
  saveFavourite,
  type FavouriteResult,
  type FavouriteView,
} from "./internal/favourites";
export { cartOwnerForWrite, currentCartOwner } from "./internal/session";
