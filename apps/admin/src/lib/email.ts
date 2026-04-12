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

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Reset your CareSync admin password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Reset your CareSync admin password</h2>
        <p>We received a request to reset your administrator password.</p>
        <p>Click the secure link below to choose a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
