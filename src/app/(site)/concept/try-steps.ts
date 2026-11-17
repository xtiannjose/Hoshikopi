/**
 * "Try it in two minutes" (Demo Mode, ADR 0015). The sign-in step says only
 * what this deploy offers: Google, an emailed link, or neither, when Guest
 * checkout is the whole demo (audit journeys:20).
 */
export function trySteps(signIn: "google" | "email" | null) {
  const how = {
    google: ", or sign in with Google first to collect Stars",
    email: ", or sign in with your email first to collect Stars",
  };
  return [
    {
      title: "Order a drink.",
      body: `Pick one from the menu and check out as a Guest${signIn ? how[signIn] : ""}. Pay at Pickup, or pay on the Test Mode checkout.`,
    },
    {
      title: "Be the barista.",
      body: "Nobody is behind this bar, so your Order page lets you tap the bar's steps yourself: Accept, Start making, Ready, Hand it over. The page follows live and chimes at Ready.",
    },
    ...(signIn
      ? [
          {
            title: "Collect a Star.",
            body: "Signed in, each drink you hand over lights a Star on your Star Card. Nine make a free drink.",
          },
        ]
      : []),
  ];
}
