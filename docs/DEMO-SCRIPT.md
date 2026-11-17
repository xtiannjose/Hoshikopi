# The two-minute demo

> **In plain words:** A script for showing Hoshikopi to someone in two minutes on the live site, https://hoshikopi.vercel.app. You order a drink as a Guest, pay on a pretend checkout, play the barista to move the Order to pickup, and show a Star landing on a Member's card. No real money moves at any point.
>
> **Who should read it:** the owner, or anyone presenting Hoshikopi to a reviewer or an interviewer; read it once and rehearse before showing it.
> **Last checked:** 2026-11-17.

This is the demo in [docs/01-PRD.md](01-PRD.md) section 8: order as a Guest (someone with no account), pay in the Test Mode checkout, watch the Order move through the bar, and collect a Star as a Member (someone signed in). The capitalised words are defined in the [Glossary](../GLOSSARY.md).

A few words the script uses:

- **Test Mode:** online payments go through a stand-in checkout page, never a real one, so no real money moves ([ADR 0003](adr/0003-payments-paymongo-test-mode.md), [ADR 0006](adr/0006-concept-project-no-real-money.md)).
- **Webhook:** a message the payment provider's server sends ours when a payment changes. Only that message can mark an Order as paid.
- **Demo Mode:** on the live demo nobody works behind the bar, so a visitor's own Order page offers the bar's steps under **Be the barista** ([ADR 0015](adr/0015-demo-mode-visitor-plays-the-barista.md)). Staff do the same on the Bar Screen ([docs/STAFF-GUIDE.md](STAFF-GUIDE.md)).
- **Concept Notice:** the line at the foot of every page that says Hoshikopi is a concept cafe, with a link **About this concept**.

The live demo takes Orders all day, so it works alone and from any time zone. One known gap: from 11:15 PM to midnight Manila time the demo takes no Orders, and checkout says so (audit DC-29 in [docs/audit/2026-11-17.md](audit/2026-11-17.md)).

**Before you start:** open the site in one window. If you want to show Stars, sign in with Google first in a private window or a second browser, so you can switch to it at 1:30. (Two tabs of the same browser share one sign-in, so the first tab would no longer be a Guest.) On the live site, email sign-in links go only to the seeded demo accounts, so Continue with Google is the quick way in.

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | Home. Point at the Concept Notice at the foot of the page, then use the Auto, Day and Night switch in the header to flip between Day and Night. | "A concept cafe in Manila and the site that runs it. The look follows the cafe's clock: cream by day, night sky from 6 PM Manila time." |
| 0:15 | Menu, then **Hoshi Latte**. Tap **Large** and **Oat milk**. | "Every Option shows its price, and the total updates as you choose: PHP 185 becomes PHP 250. The server prices everything again at checkout." |
| 0:30 | **Add to order**, open the Cart pill (the floating button with the Cart's total), then **Check out**. | "As soon as possible shows a real time, worked out from the drinks already on the bar." (It reads, for example, "Ready by 3:15 PM".) |
| 0:40 | Choose **GCash**, enter a name and an email, tap **Place order, PHP 250**, then **Pay PHP 250.00** on the Test Mode checkout. | "This is the provider's Test Mode page. The Order turns Paid only when a verified webhook says so, never because the browser came back." |
| 1:00 | On the Order page (the page the Customer lands on, which follows the Order live), use **Be the barista**: **Accept the order**, **Start making it**, **Mark it Ready**, **Hand it over**. | "Nobody is behind this bar, so the page lets you be the barista. It follows each step live and chimes at Ready. Staff do the same from the Bar Screen." |
| 1:30 | Switch to the signed-in window, order a Kopi Hitam the same way (**Pay at Pickup** is quicker: no checkout page), hand it over, then open **Stars**. | "Members earn a Star per drink at pickup. Nine make a free drink. The balance is a ledger, so a refund takes its Stars back." (A ledger is a list of every Star added or taken; the balance is their sum.) |
| 1:50 | Open **About this concept**, or the case study on GitHub ([docs/CASE-STUDY.md](CASE-STUDY.md)). | "What is invented is labelled. The decisions, the tests and the audit are in the case study." |

## If something goes wrong

- **Checkout says "Ordering is paused until 3:30 PM."**: a Manager paused ordering. Sign in as a Manager and tap **Resume ordering** on `/manage/hours` or on the Bar Screen (both ask for the Manager's 6-digit code).
- **Checkout says "No Pickup Times are left today. Walk in and order at the counter."**: the day's Pickup Windows (15-minute periods, each holding a set number of drinks) are full of earlier demo Orders. A Manager can raise Capacity on `/manage/hours`. Unpaid online demo Orders also give their room back when they expire after 15 minutes.
- **The Test Mode checkout shows an error**: tap **Go back without paying** to return to the Order page. While it says Placed, **Finish paying** reopens the checkout, and after a failed payment **Try paying again** does. (The checkout's **Make the payment fail** button shows this on purpose.) An unpaid online Order lets go of its Pickup Time after 15 minutes.

## Rehearsal

Every step above has a passing end-to-end test, an automated test that clicks through the site in a real browser ([docs/METRICS.md](METRICS.md) section 4). A script runs the order and payment part in about 9 seconds on a throttled phone (a test browser slowed down to a phone's speed and network). A spoken run-through on the live site is the last check before showing it to someone. Time it, and trim the "Say" column if it runs past two minutes.
