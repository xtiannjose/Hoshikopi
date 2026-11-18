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
  deleteOptionGroup,
  saveCategory,
  saveMenuItem,
  saveMenuItemWithPhoto,
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
  soldOutStamp,
} from "./internal/staff-queries";
export {
  priceChoices,
  type ChoiceRefusal,
  type PricedOption,
} from "./internal/pricing";
export { rollDemoMenu } from "./internal/demo";
