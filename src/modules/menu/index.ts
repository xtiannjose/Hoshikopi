// menu module: Categories, Menu Items, Option Groups, Options, Sold Out, Hidden.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  getMenu,
  getMenuItem,
  getPricedOptions,
  menuSlugs,
  type MenuCategory,
  type MenuItemCard,
  type MenuItemDetail,
  type OptionGroupView,
  type OptionView,
} from "./internal/queries";
export {
  ALLERGEN_KEYS,
  BADGE_KEYS,
  saveCategory,
  saveMenuItem,
  saveOption,
  saveOptionGroup,
  setMenuItemSoldOut,
  setOptionSoldOut,
  type FormResult,
  type MenuItemInput,
  type OptionFormInput,
} from "./internal/edit";
export {
  getMenuForStaff,
  getMenuItemForEdit,
  type MenuItemForEdit,
  type StaffMenu,
} from "./internal/staff-queries";
export { storeMenuPhoto, type PhotoResult } from "./internal/photo";
export {
  priceChoices,
  type Choice,
  type ChoiceRefusal,
  type PricedChoice,
  type PricedOption,
} from "./internal/pricing";
