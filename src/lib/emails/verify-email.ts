import { renderEmail } from "./shared";

export function verifyEmail(recipientEmail: string, verificationUrl: string) {
  const title = "Verify your email address";
  const message = `Confirm the email address ${recipientEmail} to finish setting up your Stage Manager account.`;

  return {
    subject: "Verify your Stage Manager account",
    text: [
      "Confirm your email address to finish setting up your Stage Manager account.",
      "",
      `Verify your email: ${verificationUrl}`,
      "",
      "If you didn't request this account, you can ignore this email.",
    ].join("\n"),
    html: renderEmail({
      title,
      message,
      actionLabel: "Verify email address",
      actionUrl: verificationUrl,
    }),
  };
}
