import nodemailer from "nodemailer";
import { logger } from "@/server/utils/logger";

const smtpUrl = process.env.SMTP_URL;
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

let transporter: nodemailer.Transporter | null = null;

if (gmailUser && gmailPass) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
} else if (smtpUrl) {
  transporter = nodemailer.createTransport(smtpUrl);
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyLink = `${baseUrl}/verify-email?token=${token}`;

  const subject = "Verify your email - Marketly AI";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Marketly AI!</h2>
      <p>Thank you for signing up. Please verify your email address to get started.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p style="color: #666; font-size: 14px; margin-top: 32px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      const fromEmail = gmailUser ? `"Marketly AI" <${gmailUser}>` : process.env.SMTP_FROM_EMAIL || '"Marketly AI" <noreply@marketly.ai>';
      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject,
        html,
      });
      console.log(`[MailService] Sent verification email to ${email}`);
    } catch (error) {
      console.error("[MailService] Failed to send email", error);
    }
  } else {
    // Development fallback
    console.log("------------------------------------------------------------------");
    console.log(`[MailService Mock] Email sent to: ${email}`);
    console.log(`[MailService Mock] Subject: ${subject}`);
    console.log(`[MailService Mock] VERIFICATION LINK: ${verifyLink}`);
    console.log("------------------------------------------------------------------");
  }
}

export async function sendAdminEmail(email: string, subject: string, message: string) {
  if (transporter) {
    try {
      const fromEmail = gmailUser ? `"Marketly AI Admin" <${gmailUser}>` : process.env.SMTP_FROM_EMAIL || '"Marketly AI Admin" <noreply@marketly.ai>';
      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject,
        text: message,
      });
      console.log(`[MailService] Sent admin email to ${email}`);
    } catch (error) {
      console.error("[MailService] Failed to send admin email", error);
      throw error;
    }
  } else {
    console.log("------------------------------------------------------------------");
    console.log(`[MailService Mock Admin] To: ${email}`);
    console.log(`[MailService Mock Admin] Subject: ${subject}`);
    console.log(`[MailService Mock Admin] Message: \n${message}`);
    console.log("------------------------------------------------------------------");
  }
}
