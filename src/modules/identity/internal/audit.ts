import type { Prisma } from "@/generated/prisma/client";
import { db, type Client } from "@/lib/db";

/** Record a Staff write (docs/03-ARCHITECTURE.md section 13). */
export async function audit(
  actor: { id: string },
  action: string,
  target: { type: string; id: string },
  data: Prisma.InputJsonValue = {},
  client: Client = db
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: actor.id,
      action,
      targetType: target.type,
      targetId: target.id,
      data,
    },
  });
}
