import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function getFromAddress() {
  return process.env.SMTP_FROM ?? `CareSync <${process.env.SMTP_USER}>`;
}

export async function sendHospitalInviteEmail(email: string, token: string) {
  const transporter = getTransporter();
  const registrationUrl = process.env.HOSPITAL_REGISTER_URL ?? "http://localhost:5000/register";

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "CareSync Hospital Invitation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">CareSync Hospital Invitation</h2>
        <p>Your hospital has been invited to join CareSync.</p>
        <p>Use the invitation token below during registration:</p>
        <p style="font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #0f766e;">${token}</p>
        <p>Register here: <a href="${registrationUrl}">${registrationUrl}</a></p>
        <p>If you did not expect this invitation, you can ignore this email.</p>
      </div>
    `,
  });
}
