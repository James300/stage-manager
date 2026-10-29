import { renderEmail } from "./shared";

export function signInLinkEmail(recipientEmail: string, signInUrl: string) {
  const title = "Your sign-in link";
  const message = `A sign-in link was requested for ${recipientEmail}. Use it to sign in to Stage Manager. This link expires in 15 minutes and can only be used once.`;

  return {
    subject: "Your Stage Manager sign-in link",
    text: [
      "A sign-in link was requested for your Stage Manager account.",
      "",
      `Sign in: ${signInUrl}`,
      "",
      "This link expires in 15 minutes and can only be used once. If you didn't request it, you can ignore this email.",
    ].join("\n"),
    html: renderEmail({
      title,
      message,
      actionLabel: "Sign in to Stage Manager",
      actionUrl: signInUrl,
      closing: "This link expires in 15 minutes and can only be used once. If you didn't request it, you can ignore this email.",
    }),
  };
}
