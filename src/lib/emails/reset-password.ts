import { escapeHtml, renderEmail } from "./shared";

export function resetPasswordEmail(recipientEmail: string, resetPasswordUrl: string) {
  const safeUrl = escapeHtml(resetPasswordUrl);
  const title = "Reset your password";
  const message = `We received a request to reset the password for ${recipientEmail}. Use the link below to choose a new password. If you didn't request this, you can ignore this email.`;

  return {
    subject: "Reset your Stage Manager password",
    text: [
      "We received a request to reset the password for your Stage Manager account.",
      "",
      `Reset your password: ${resetPasswordUrl}`,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
    html: renderEmail({
      title,
      message,
      actionLabel: "Reset password",
      actionUrl: safeUrl,
    }),
  };
}
