import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalInvitesTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const [existing] = await db.select().from(hospitalInvitesTable).where(eq(hospitalInvitesTable.email, email)).limit(1);
    
    if (existing && existing.status === "pending") {
      return NextResponse.json({ message: "Invite originally sent", token: existing.token }, { status: 200 });
    }

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    
    await db.insert(hospitalInvitesTable).values({
      id: crypto.randomUUID(),
      email,
      token,
      status: "pending"
    });

    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        auth: {
            user: process.env.SMTP_USER || 'mcdonald.kuphal48@ethereal.email',
            pass: process.env.SMTP_PASS || 'd8aYQ6Kz93V6hQYgY1'
        }
      });
      
      await transporter.sendMail({
        from: '"iCare System Admin" <admin@icare.local>',
        to: email,
        subject: "iCare Hospital Registration Invite",
        html: `<h2>Welcome to iCare!</h2>
               <p>Your hospital has been authorized for the iCare ecosystem.</p>
               <p>Your secure registration token is: <strong style="font-size: 1.2rem; color: #0284c7;">${token}</strong></p>
               <br/><p>Please navigate to <b>localhost:5000/register</b> and register your provider account.</p>`
      });
      console.log(`Invite email dispatched to ${email}`);
    } catch(err) {
      console.warn("Mail dispatch failed, continuing without email...", err);
    }

    return NextResponse.json({ message: "Invite generated successfully", token }, { status: 201 });
  } catch (error) {
    console.error("Invite generation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invites = await db.select({
      id: hospitalInvitesTable.id,
      email: hospitalInvitesTable.email,
      token: hospitalInvitesTable.token,
      status: hospitalInvitesTable.status,
      createdAt: hospitalInvitesTable.createdAt
    }).from(hospitalInvitesTable);

    return NextResponse.json(invites);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
