import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokensTable, usersTable } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (user?.role === "hospital" || user?.role === "doctor") {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokensTable).values({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetBaseUrl = process.env.HOSPITAL_RESET_PASSWORD_URL ?? "http://localhost:5000/reset-password";
      const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return NextResponse.json({
      message: "If a provider or doctor account exists for this email, we have sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Unable to process password reset right now." }, { status: 500 });
  }
}
