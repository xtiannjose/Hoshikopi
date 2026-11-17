import { describe, expect, it } from "vitest";

import { refuseRemoteDatabase } from "../prisma/local-only";

// `vercel env pull` writes the Neon integration's DATABASE_URL_UNPOOLED into
// .env.local, and prisma.config.ts falls back to it, so `npm run db:reset`
// on a developer's computer could wipe the live database (audit DC-03).
describe("refuseRemoteDatabase (audit DC-03)", () => {
  const neon =
    "postgresql://owner:s3cret@ep-quiet-star-a1b2.ap-southeast-1.aws.neon.tech/neondb";

  it("allows the database on this computer", () => {
    for (const url of [
      "postgresql://postgres:dev@127.0.0.1:5434/hoshikopi",
      "postgresql://postgres:dev@localhost:5432/hoshikopi_test",
    ]) {
      expect(() => refuseRemoteDatabase(url, {})).not.toThrow();
    }
  });

  it("lets an empty URL through, so prisma generate works with no database", () => {
    expect(() => refuseRemoteDatabase("", {})).not.toThrow();
  });

  it("refuses a remote database, naming its host but never its password", () => {
    let message = "";
    try {
      refuseRemoteDatabase(neon, {});
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(
      "ep-quiet-star-a1b2.ap-southeast-1.aws.neon.tech"
    );
    expect(message).toContain("ALLOW_REMOTE_SEED=1");
    expect(message).not.toContain("s3cret");
  });

  it("allows a remote database on Vercel, or when asked for on purpose", () => {
    expect(() => refuseRemoteDatabase(neon, { VERCEL: "1" })).not.toThrow();
    expect(() =>
      refuseRemoteDatabase(neon, { ALLOW_REMOTE_SEED: "1" })
    ).not.toThrow();
  });
});
