// content module: Events and Posts.
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
