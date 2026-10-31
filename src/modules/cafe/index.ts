// cafe module: Opening Hours, Special Hours, Capacity, Ordering Paused, the
// cafe's details and Amenities.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  getCafeContact,
  getCafeDetails,
  getHours,
  type Amenities,
  type CafeContact,
  type CafeDetails,
} from "./internal/details";
export { ROOM_PHOTOS, type RoomPhoto } from "./internal/room";
export { saveCafeDetails, type DetailsResult } from "./internal/save-details";
