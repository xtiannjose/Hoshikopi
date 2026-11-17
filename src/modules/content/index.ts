// content module: Events, Recurring Events, Posts and Inquiries.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  contentForStaff,
  deletePost,
  getEvent,
  getEvents,
  getPost,
  getPosts,
  /** Tests only (audit architecture:19). */
  readEvents,
  /** Tests only (audit architecture:19). */
  readPosts,
  saveEvent,
  savePost,
  type EventCard,
  type PostCard,
} from "./internal/content";
export { eventCalendar } from "./internal/calendar";
export { rollDemoEvents } from "./internal/demo";
export { forgetGuest, guestRecordsFor } from "./internal/guests";
export {
  getRecurringEvents,
  /** Tests only (audit architecture:19). */
  readRecurringEvents,
  recurringForStaff,
  saveRecurringEvent,
  type RecurringEventView,
} from "./internal/weekly";
export {
  inquiriesForStaff,
  setInquiryStatus,
  submitInquiry,
  type InquiryView,
} from "./internal/inquiries";
export {
  cancelSignup,
  confirmSignup,
  HOLD_MINUTES,
  removeSignup,
  signupForGuest,
  SIGNUPS_PER_VISITOR,
  signUpForEvent,
  signupsForEvent,
  type SignupView,
} from "./internal/signups";
