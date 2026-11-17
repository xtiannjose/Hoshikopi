import { takeToken } from "./rate-limit";

const MINUTE = 60;
const FIFTEEN_MINUTES = 15 * MINUTE;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Pay at Pickup Orders cost nothing to leave uncollected (audit ORD-14). */
export const PAY_AT_PICKUP_A_DAY = { guestIp: 10, member: 5 };

/**
 * Every limit on what anyone can send without being Staff, in one place.
 * Each is true when the request may go ahead; a refused step spends nothing
 * after it. The numbers are the rate-limit table in docs/03 section 13, and
 * tests/db/limits.test.ts checks each one (audit DC-11). Limits inside a
 * module (Sign-ups per visitor, Second Factor tries) stay with their module.
 */
export const limits = {
  /**
   * Sign-in links: per IP, per address from one IP, and per address from
   * anywhere. The last is five times the pair's, so a stranger needs five
   * connections, not two, to use up someone's links (audit ID2-05, DC-09).
   */
  signInLink: async (email: string, ip: string) =>
    (await takeToken(`link-ip:${ip}`, 30, FIFTEEN_MINUTES)) &&
    (await takeToken(`link-pair:${email}:${ip}`, 3, FIFTEEN_MINUTES)) &&
    (await takeToken(`link:${email}`, 15, FIFTEEN_MINUTES)),

  /** Each start of Google sign-in writes a row (audit ID2-10). */
  googleSignIn: (ip: string) =>
    takeToken(`google-ip:${ip}`, 30, FIFTEEN_MINUTES),

  /** Every checkout try, so nobody holds Pickup Windows with a flood. */
  checkout: async (cartKey: string, ip: string) =>
    (await takeToken(`checkout:${cartKey}`, 10, FIFTEEN_MINUTES)) &&
    (await takeToken(`checkout-ip:${ip}`, 20, FIFTEEN_MINUTES)),

  /**
   * Pay at Pickup Orders a day: per IP for Guests (ORD-14), and per account
   * for Members, who had no limit, so one free Google account could fill a
   * day's Pickup Windows (audit DC-08).
   */
  payAtPickup: (memberId: string | null, ip: string) =>
    memberId
      ? takeToken(
          `pay-at-pickup-member:${memberId}`,
          PAY_AT_PICKUP_A_DAY.member,
          DAY
        )
      : takeToken(`pay-at-pickup-ip:${ip}`, PAY_AT_PICKUP_A_DAY.guestIp, DAY),

  inquiry: (ip: string) => takeToken(`inquiry-ip:${ip}`, 5, HOUR),

  eventSignup: (ip: string) => takeToken(`signup-ip:${ip}`, 10, HOUR),

  /** The provider retries a 429, so a burst only slows its own deliveries. */
  webhook: (ip: string) => takeToken(`webhook-ip:${ip}`, 120, MINUTE),
};
