import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { endSessions, setRole, staffMembers } from "@/modules/identity";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

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
  await resetDb(db);
  await seedDatabase(db);
});
afterAll(() => db.$disconnect());

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
    await setRole(christian, ANNIKA, "customer");
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
      setRole(christian, HOSHI, "barista"),
      setRole(hoshi, "christian@hoshikopi.example", "barista"),
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
