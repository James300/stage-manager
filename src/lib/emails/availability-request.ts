import { renderEmail } from "./shared";

export function availabilityRequestEmail(
  recipientName: string,
  availabilityUrl: string,
  deadline: string,
) {
  const title = "Please share your availability";
  const message = `Hi ${recipientName}, we're planning upcoming rehearsals and need to know when you're available.`;
  const closing = `Please submit your availability by ${deadline}. Your personal link is for you only.`;

  return {
    subject: "Please share your rehearsal availability",
    text: [
      `Hi ${recipientName},`,
      "",
      "We're planning upcoming rehearsals and need to know when you're available.",
      "",
      `Submit your availability: ${availabilityUrl}`,
      "",
      `Please respond by ${deadline}. Your personal link is for you only.`,
    ].join("\n"),
    html: renderEmail({
      title,
      message,
      actionLabel: "Share availability",
      actionUrl: availabilityUrl,
      closing,
    }),
  };
}
