// notify module: email templates and sending.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
import { send } from "./internal/outbox";

export async function sendSignInLink(email: string, url: string) {
  await send({
    to: email,
    subject: "Your Hoshikopi sign-in link",
    text: `Tap this link to sign in to Hoshikopi. It works once, for 5 minutes.\n\n${url}\n\nDidn't ask for it? You can ignore this email.`,
  });
}
