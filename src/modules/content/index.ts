// content module: Events, Recurring Events, Posts and Inquiries.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export {
  contentForStaff,
  getEvent,
  getEvents,
  getPost,
  getPosts,
  readEvents,
  readPosts,
  saveEvent,
  savePost,
  type ContentResult,
  type EventCard,
  type PostCard,
} from "./internal/content";
export { eventCalendar } from "./internal/calendar";
export {
  getRecurringEvents,
  readRecurringEvents,
  recurringForStaff,
  saveRecurringEvent,
  type RecurringEventView,
  type RecurringInput,
} from "./internal/weekly";
export {
  inquiriesForStaff,
  setInquiryStatus,
  submitInquiry,
  type InquiryInput,
  type InquiryResult,
  type InquiryView,
} from "./internal/inquiries";
export {
  signUpForEvent,
  signupsForEvent,
  type SignupInput,
  type SignupResult,
} from "./internal/signups";
