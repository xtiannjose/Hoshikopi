/** "Saved. 2 Orders today are booked after the new closing. ..." (audit ORD-20, DC-14). */
export function bookedNote(done: string, booked: number) {
  return `${done} ${booked === 1 ? "1 Order today is" : `${booked} Orders today are`} booked after the new closing. Cancel ${booked === 1 ? "it" : "them"} with a reason on the Orders page.`;
}
