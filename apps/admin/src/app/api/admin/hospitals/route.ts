import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalsTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hospitals = await db.select({
      id: hospitalsTable.id,
      name: hospitalsTable.name,
      address: hospitalsTable.address,
      contactNumber: hospitalsTable.contactNumber,
      approvalStatus: hospitalsTable.approvalStatus,
      createdAt: hospitalsTable.createdAt
    }).from(hospitalsTable);

    return NextResponse.json(hospitals);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update Hospital Approval Status (Approve/Reject)
export async function PATCH(req: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db.update(hospitalsTable).set({ approvalStatus: status as "pending" | "approved" | "rejected" }).where(eq(hospitalsTable.id, id));

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
