import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET as cron } from "@/app/api/cron/daily/route";
import { POST as webhook } from "@/app/api/webhooks/[provider]/route";

import { createTestDb, resetToSeed } from "./helpers";

// A route handler outside Next has no request store and no cache.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  revalidateTag: () => {},
}));

const db = createTestDb();

const SECRET = "cron-secret-for-tests";

beforeEach(async () => {
  await resetToSeed(db);
  vi.stubEnv("CRON_SECRET", SECRET);
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => db.$disconnect());

const fake = { params: Promise.resolve({ provider: "fake" }) };

// The webhook read any body, up to Vercel's 4.5 MB (audit SEC2-09, SEC1-10).
describe("POST /api/webhooks/[provider]", () => {
  it("refuses a body over 64 kB before reading it as an event", async () => {
    const big = "x".repeat(64 * 1024 + 1);
    const response = await webhook(
      new Request("http://localhost/api/webhooks/fake", {
        method: "POST",
        body: big,
      }),
      fake
    );
    expect(response.status).toBe(413);
  });

  it("still answers an ordinary body (an unsigned one is refused as before)", async () => {
    const response = await webhook(
      new Request("http://localhost/api/webhooks/fake", {
        method: "POST",
        body: "{}",
      }),
      fake
    );
    expect(response.status).not.toBe(413);
  });
});

// The secret was compared with !==, which can leak through timing (audit
// SEC2-13, SEC1-21).
describe("GET /api/cron/daily", () => {
  const call = (authorization?: string) =>
    cron(
      new Request("http://localhost/api/cron/daily", {
        headers: authorization ? { authorization } : {},
      })
    );

  it("refuses a missing, wrong or near-miss secret", async () => {
    for (const header of [
      undefined,
      "Bearer wrong",
      `Bearer ${SECRET}x`,
      `Bearer ${SECRET.slice(0, -1)}`,
      SECRET,
    ]) {
      expect((await call(header)).status, String(header)).toBe(401);
    }
  });

  it("runs with the right secret", async () => {
    const response = await call(`Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ expired: 0, cancelled: 0 });
  });
});
