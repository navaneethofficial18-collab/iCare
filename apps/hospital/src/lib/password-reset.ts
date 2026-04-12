import { createHash, randomBytes } from "crypto";
import { db } from "@/db";
import { passwordResetTokensTable } from "@/db/schema";

export async function createPasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}
