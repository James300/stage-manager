import "server-only";
import nodemailer from "nodemailer";
import { resetPasswordEmail } from "./emails/reset-password";
import { verifyEmail } from "./emails/verify-email";
import { signInLinkEmail } from "./emails/sign-in-link";
import { availabilityRequestEmail } from "./emails/availability-request";
import { schedulePublishedEmail } from "./emails/schedule-published";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function assertEmailConfiguration() {
  const requiredSettings = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
  ] as const;
  const missingSettings = requiredSettings.filter((name) => !process.env[name]);

  if (missingSettings.length > 0) {
    throw new Error(`Missing email configuration: ${missingSettings.join(", ")}.`);
  }
}

async function sendTemplate(to: string, content: ReturnType<typeof resetPasswordEmail>) {
  assertEmailConfiguration();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    ...content,
  });
}

export async function sendResetPasswordEmail(to: string, resetPasswordUrl: string) {
  await sendTemplate(to, resetPasswordEmail(to, resetPasswordUrl));
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  await sendTemplate(to, verifyEmail(to, verificationUrl));
}

export async function sendSignInLinkEmail(to: string, signInUrl: string) {
  await sendTemplate(to, signInLinkEmail(to, signInUrl));
}

export async function sendAvailabilityRequestEmail(
  to: string,
  recipientName: string,
  availabilityUrl: string,
  deadline: string,
) {
  await sendTemplate(to, availabilityRequestEmail(recipientName, availabilityUrl, deadline));
}

export async function sendSchedulePublishedEmail(
  to: string,
  recipientName: string,
  scheduleUrl: string,
  productionName?: string,
) {
  await sendTemplate(to, schedulePublishedEmail(recipientName, scheduleUrl, productionName));
}

export async function sendEmail(to: string, subject: string, text: string) {
  assertEmailConfiguration();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}
