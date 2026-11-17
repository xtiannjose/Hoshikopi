/**
 * The browser tests order against the real clock, so a run that reaches
 * the demo's 11:15 PM Last Order, or crosses midnight into a new service
 * day, fails half way for no fault of the code. Refuse to start after
 * 10 PM Manila time (about an hour before, for a run of 10 to 15 minutes);
 * nothing guarded this before (audit DC-42).
 */
export default function timeGuard() {
  const manilaHour = new Date(Date.now() + 8 * 3_600_000).getUTCHours();
  if (manilaHour >= 22) {
    throw new Error(
      "It is past 10 PM in Manila: the browser tests would reach the demo's 11:15 PM Last Order or midnight. Run them after midnight Manila time."
    );
  }
}
