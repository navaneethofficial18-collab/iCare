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

export async function sendHospitalWelcomeEmail(email: string, hospitalName: string) {
  const transporter = getTransporter();
  const adminUrl = process.env.HOSPITAL_APP_URL ?? "http://localhost:5000/login";

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Welcome to CareSync",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Welcome to CareSync</h2>
        <p>${hospitalName}, your hospital account is now active.</p>
        <p>You can sign in here: <a href="${adminUrl}">${adminUrl}</a></p>
        <p>We’re glad to have you on board.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Reset your CareSync hospital password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Reset your CareSync hospital password</h2>
        <p>We received a request to reset your provider password.</p>
        <p>Click the secure link below to choose a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
