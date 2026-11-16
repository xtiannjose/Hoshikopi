import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Role } from "@/generated/prisma/enums";
import { freezeClock, now, unfreezeClock } from "@/lib/clock";
import {
  authHandler,
  currentMember,
  currentStaff,
  emailSignInLink,
  endSessions,
  requireStaff,
  secondFactorEntered,
  setRole,
  staffMembers,
} from "@/modules/identity";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, mailTo, resetDb } from "./helpers";

// The guards read the request's cookie, and a test has no request: the
// browser's cookie lives here.
const browser = vi.hoisted(() => ({ cookie: "" }));
vi.mock("next/headers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/headers")>()),
  headers: async () =>
    new Headers(browser.cookie ? { cookie: browser.cookie } : {}),
}));
// connection() needs a request scope.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));

const db = createTestDb();
// Seeded people: Manager Christian, Barista Annika, Member Hoshi.
const christian = { id: "seed-manager" };
const HOSHI = "hoshi@hoshikopi.example";
const ANNIKA = "annika@hoshikopi.example";

const roleOf = async (email: string) =>
  (await db.user.findUniqueOrThrow({ where: { email } })).role;

async function sessionFor(userId: string) {
  await db.session.create({
    data: {
      id: `session-${userId}-${Math.random()}`,
      token: `token-${Math.random()}`,
      expiresAt: new Date("2030-01-01T00:00:00Z"),
      userId,
    },
  });
}

beforeEach(async () => {
  browser.cookie = "";
  await resetDb(db);
  await seedDatabase(db);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/**
 * A new person with `role`, signed in through their emailed link as a
 * browser would be; with `secondFactor`, the session has entered it now.
 */
async function signInAs(role: Role, secondFactor = false) {
  const email = `${role}-${Math.random().toString(36).slice(2)}@example.com`;
  await db.user.create({
    data: { id: email, name: role, email, emailVerified: true, role },
  });
  browser.cookie = "";
  await emailSignInLink(email, "/manage");
  const [mail] = await mailTo(email);
  const res = await authHandler.GET(
    new Request(mail.match(/https?:\/\/\S+/)![0])
  );
  expect(res.headers.get("location")).not.toContain("error=");
  browser.cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  if (secondFactor) {
    await db.session.updateMany({
      where: { userId: email },
      data: { secondFactorAt: now() },
    });
  }
  return email;
}

describe("Staff management (STAFF-10)", () => {
  it("lists the Staff, Managers first, without Members", async () => {
    expect((await staffMembers()).map((s) => [s.email, s.role])).toEqual([
      ["christian@hoshikopi.example", "manager"],
      [ANNIKA, "barista"],
    ]);
  });

  it("makes a Member a Barista and logs who did it", async () => {
    expect(
      await setRole(christian, ` ${HOSHI.toUpperCase()} `, "barista")
    ).toEqual({
      ok: true,
      name: "Hoshi",
    });
    expect(await roleOf(HOSHI)).toBe("barista");
    expect(
      await db.auditLog.findFirst({
        where: { action: "identity.role.update", targetId: "seed-member" },
      })
    ).toMatchObject({
      actorId: "seed-manager",
      data: { from: "customer", to: "barista" },
    });
  });

  it("ends the sessions of someone who loses a role, not of someone who gains one", async () => {
    await sessionFor("seed-barista");
    await sessionFor("seed-member");
    await setRole(christian, ANNIKA, "customer", "barista");
    await setRole(christian, HOSHI, "manager");
    expect(await db.session.count({ where: { userId: "seed-barista" } })).toBe(
      0
    );
    expect(await db.session.count({ where: { userId: "seed-member" } })).toBe(
      1
    );
  });

  it("refuses an email with no account, and a Manager changing their own role", async () => {
    expect(await setRole(christian, "nobody@example.com", "barista")).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(
      await setRole(christian, "christian@hoshikopi.example", "barista")
    ).toEqual({ ok: false, reason: "self" });
    expect(await roleOf("christian@hoshikopi.example")).toBe("manager");
  });

  it("always keeps one Manager, even when two Managers demote each other at once", async () => {
    await setRole(christian, HOSHI, "manager");
    const hoshi = { id: "seed-member" };
    const results = await Promise.all([
      setRole(christian, HOSHI, "barista", "manager"),
      setRole(hoshi, "christian@hoshikopi.example", "barista", "manager"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(
      await db.user.count({ where: { role: "manager", deletedAt: null } })
    ).toBe(1);
  });

  it("ends a person's sessions on request and logs it", async () => {
    await sessionFor("seed-barista");
    await sessionFor("seed-barista");
    expect(await endSessions(christian, "seed-barista")).toEqual({ ok: true });
    expect(await db.session.count({ where: { userId: "seed-barista" } })).toBe(
      0
    );
    expect(
      await db.auditLog.count({ where: { action: "identity.sessions.end" } })
    ).toBe(1);
  });
});

// Nothing tested the Staff guard with a real session (audit tests:13).
describe("requireStaff", () => {
  it.each([
    ["a Member", "customer", false, "barista", "/bar", "NEXT_NOT_FOUND"],
    [
      "a Barista where a Manager is needed",
      "barista",
      true,
      "manager",
      "/manage/orders",
      "NEXT_NOT_FOUND",
    ],
    [
      "a Manager without the Second Factor",
      "manager",
      false,
      "manager",
      "/manage/orders",
      "NEXT_REDIRECT /manage/two-factor?next=%2Fmanage%2Forders",
    ],
  ] as const)("refuses %s", async (_, role, passed, needs, next, thrown) => {
    await signInAs(role, passed);
    await expect(requireStaff(needs, next)).rejects.toThrow(thrown);
  });

  // The check rode on the path: a Manager-level call that returned to
  // the Bar Screen skipped it (audit ID2-07).
  it("asks for the Second Factor on any Manager-level check, wherever it returns to", async () => {
    await signInAs("manager");
    await expect(requireStaff("barista", "/bar")).resolves.toMatchObject({
      role: "manager",
    });
    await expect(requireStaff("manager", "/bar")).rejects.toThrow(
      "NEXT_REDIRECT /manage/two-factor?next=%2Fbar"
    );
    await signInAs("barista");
    await expect(requireStaff("barista", "/bar")).resolves.toMatchObject({
      role: "barista",
    });
    await expect(requireStaff("barista", "/manage/menu")).rejects.toThrow(
      "NEXT_REDIRECT /manage/two-factor?next=%2Fmanage%2Fmenu"
    );
    await expect(requireStaff("barista", "/account")).rejects.toThrow(
      "NEXT_REDIRECT /manage/two-factor?next=%2Faccount"
    );
  });

  // A pass never expired inside a 7-day session (audit SEC1-14).
  it("lets a Second Factor pass last 12 hours", async () => {
    await signInAs("manager", true);
    const passed = now();
    freezeClock(new Date(passed.getTime() + 12 * 3_600_000 - 60_000));
    await expect(
      requireStaff("manager", "/manage/orders")
    ).resolves.toMatchObject({ role: "manager" });
    expect(await secondFactorEntered()).toBe(true);
    freezeClock(new Date(passed.getTime() + 12 * 3_600_000));
    await expect(requireStaff("manager", "/manage/orders")).rejects.toThrow(
      "NEXT_REDIRECT /manage/two-factor?next=%2Fmanage%2Forders"
    );
    expect(await secondFactorEntered()).toBe(false);
  });

  // Better Auth trusted its 5-minute cookie cache, so a session ended
  // elsewhere kept the Bar Screen working (audit staff:17).
  it("stops at once when the session is ended elsewhere", async () => {
    const email = await signInAs("barista");
    expect(browser.cookie).toContain("session_data=");
    expect(await currentStaff("barista")).toMatchObject({ id: email });
    await endSessions(christian, email);
    expect(await currentStaff("barista")).toBeNull();
    await expect(requireStaff("barista", "/bar")).rejects.toThrow(
      "NEXT_REDIRECT /sign-in?next=%2Fbar"
    );
    expect(await currentMember()).toBeNull();
  });
});

// A dropped role check would pass every other test (audit tests:13).
describe("Staff management by someone who isn't a Manager", () => {
  it.each([
    ["a Barista", "seed-barista"],
    ["a Member", "seed-member"],
  ])("refuses role changes and sign-outs from %s", async (_, id) => {
    await sessionFor("seed-manager");
    expect(
      await setRole(
        { id },
        "christian@hoshikopi.example",
        "customer",
        "manager"
      )
    ).toEqual({ ok: false, reason: "not_allowed" });
    expect(await endSessions({ id }, "seed-manager")).toEqual({
      ok: false,
      reason: "not_allowed",
    });
    expect(await roleOf("christian@hoshikopi.example")).toBe("manager");
    expect(await db.session.count({ where: { userId: "seed-manager" } })).toBe(
      1
    );
  });
});

// Add Staff defaulted to Barista, so typing a Manager's email demoted
// them and signed them out (audit staff:16).
describe("lowering a role", () => {
  it("needs the role the Manager saw, so Add Staff never demotes anyone", async () => {
    await setRole(christian, HOSHI, "manager");
    await sessionFor("seed-member");
    expect(await setRole(christian, HOSHI, "barista")).toEqual({
      ok: false,
      reason: "lower",
      name: "Hoshi",
      role: "manager",
    });
    expect(await roleOf(HOSHI)).toBe("manager");
    expect(await db.session.count({ where: { userId: "seed-member" } })).toBe(
      1
    );
    // A row that still showed Barista.
    expect(
      await setRole(christian, HOSHI, "customer", "barista")
    ).toMatchObject({ ok: false, reason: "lower" });
    expect(await setRole(christian, HOSHI, "barista", "manager")).toEqual({
      ok: true,
      name: "Hoshi",
    });
    expect(await roleOf(HOSHI)).toBe("barista");
    // Raising needs no source role: Add Staff still promotes.
    expect(await setRole(christian, ANNIKA, "manager")).toEqual({
      ok: true,
      name: "Annika",
    });
  });
});
