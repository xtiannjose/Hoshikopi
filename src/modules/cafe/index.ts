// cafe module: Opening Hours, Special Hours, Capacity, Ordering Paused, the
// cafe's details and Amenities.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  getCafeContact,
  getCafeDetails,
  getHours,
  type Amenities,
  type CafeDetails,
} from "./internal/details";
export { ROOM_PHOTOS, type RoomPhoto } from "./internal/room";
export { saveCafeDetails } from "./internal/save-details";
export {
  orderingState,
  pickupWindows,
  prepMinutes,
  type Counts,
  type OrderingDay,
  type OrderingState,
  type PickupWindow,
  WINDOW_MINUTES,
} from "./internal/ordering-day";
export { getHoursForStaff, getOrderingDay } from "./internal/ordering-day-db";
export {
  BUSY_FOR_MINUTES,
  BUSY_MINUTES,
  deleteSpecialHours,
  endBusyMode,
  pauseOrdering,
  resumeOrdering,
  saveCapacity,
  saveSpecialHours,
  saveWeeklyHours,
  startBusyMode,
} from "./internal/save-hours";
