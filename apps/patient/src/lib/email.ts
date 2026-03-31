import nodemailer from "nodemailer";

const globalForMailer = globalThis as typeof globalThis & {
  __caresyncPatientMailer?: nodemailer.Transporter;
};

function getTransporter() {
  if (globalForMailer.__caresyncPatientMailer) {
    return globalForMailer.__caresyncPatientMailer;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user,
      pass,
    },
  });

  globalForMailer.__caresyncPatientMailer = transporter;
  return transporter;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? `CareSync <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your CareSync password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Reset your CareSync password</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the secure link below to choose a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
