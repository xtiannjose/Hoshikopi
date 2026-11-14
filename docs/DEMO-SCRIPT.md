# The two-minute demo

A script for showing Hoshikopi to someone in two minutes on the live site, https://hoshikopi.vercel.app. It is the demo in `docs/01-PRD.md` section 8: order as a Guest, pay in the Test Mode checkout, watch the Order move through the bar, collect a Star as a Member.

The hosted demo takes Orders all day, and Demo Mode lets you play the barista on your own Order, so it works alone and from any time zone (ADR 0015). No real money moves (ADR 0006).

**Before you start:** open the site in one tab. If you want to show Stars, sign in with Google first in a second tab, so you can switch to it at 1:30. On the live site, email links go only to the seeded accounts, so Google is the quick way in.

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | Home. Point at the Concept Notice at the foot of the page, then use the switch in the header to flip between Day and Night. | "A concept cafe in Manila and the site that runs it. The look follows the cafe's clock: cream by day, night sky from 6 PM Manila time." |
| 0:15 | Menu, then **Hoshi Latte**. Tap **Large** and **Oat milk**. | "Every Option shows its price, and the total updates as you choose: PHP 185 becomes PHP 250. The server prices everything again at checkout." |
| 0:30 | **Add to order**, open the Cart pill, then **Check out**. | "ASAP shows a real time, worked out from the drinks already on the bar." |
| 0:40 | Choose **GCash**, enter a name and an email, **Place order**, then **Pay PHP 250** on the Test Mode checkout. | "This is the provider's Test Mode page. The Order turns Paid only when a verified webhook says so, never because the browser came back." |
| 1:00 | On the Order page, use **Be the barista**: **Accept the order**, **Start making it**, **Mark it Ready**, **Hand it over**. | "Nobody is behind this bar, so the page lets you be the barista. It follows each step live and chimes at Ready. Staff do the same from the Bar Screen." |
| 1:30 | Switch to the signed-in tab, order a Kopi Hitam the same way (**Pay at Pickup** is quicker), hand it over, then open **Stars**. | "Members earn a Star per drink at pickup. Nine make a free drink. The balance is a ledger, so a refund takes its Stars back." |
| 1:50 | Open **About this concept**, or the case study on GitHub. | "What is invented is labelled. The decisions, the tests and the audit are in the case study." |

## If something goes wrong

- **"We're not taking orders right now"**: a Manager paused ordering. Sign in as a Manager and resume it from `/manage/hours` or the Bar Screen.
- **No Pickup Times are left**: the day's windows are full of earlier demo Orders. ASAP still works once the queue moves. A Manager can raise Capacity on `/manage/hours`.
- **The Test Mode checkout shows an error**: go back to the Order page. While it says Placed, **Finish paying** reopens the checkout. An unpaid online Order lets go of its Pickup Time after 15 minutes.

## Rehearsal

Every step above has a passing end-to-end test (`docs/METRICS.md` section 4), and a script runs the order and payment part in about 9 seconds on a throttled phone. A spoken run-through on the live site is the last check before showing it to someone. Time it, and trim the "Say" column if it runs past two minutes.
