// menu module: Categories, Menu Items, Option Groups, Options, Sold Out, Hidden.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  getMenu,
  getMenuItem,
  getPricedOptions,
  menuSlugs,
  type MenuCategory,
  type MenuItemCard,
  type OptionGroupView,
  type Pairing,
} from "./internal/queries";
export {
  saveCategory,
  saveMenuItem,
  saveOption,
  saveOptionGroup,
  setMenuItemSoldOut,
  setOptionSoldOut,
  type MenuItemInput,
  type OptionFormInput,
} from "./internal/edit";
export {
  getMenuForStaff,
  getMenuItemForEdit,
  itemsOfferingGroup,
} from "./internal/staff-queries";
export { storeMenuPhoto } from "./internal/photo";
export {
  priceChoices,
  type ChoiceRefusal,
  type PricedOption,
} from "./internal/pricing";
