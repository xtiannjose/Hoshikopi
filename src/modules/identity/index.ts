// identity module: Members, Staff roles, sessions, the audit log.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "./internal/auth";

/** Better Auth endpoints for /api/auth/[...all]. */
export const authHandler = toNextJsHandler(auth);

export { audit } from "./internal/audit";
export { googleEnabled } from "./internal/auth";
export {
  currentMember,
  memberByEmail,
  requireMember,
  requireStaff,
  signOut,
  staffAwaitingSecondFactor,
  type Member,
  type Staff,
} from "./internal/session";
export { emailSignInLink, googleSignInUrl, safeNext } from "./internal/sign-in";
export {
  enterSecondFactor,
  secondFactorEnrolment,
  type SecondFactorEnrolment,
  type SecondFactorResult,
} from "./internal/second-factor";
export {
  forgetMember,
  memberProfile,
  updateProfile,
  type MemberProfile,
} from "./internal/privacy";
