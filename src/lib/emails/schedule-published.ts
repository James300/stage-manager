import { renderEmail } from "./shared";

export function schedulePublishedEmail(
  recipientName: string,
  scheduleUrl: string,
  productionName = "Into the Woods",
) {
  const title = "The rehearsal schedule is ready";
  const message = `Hi ${recipientName}, the rehearsal schedule for ${productionName} has been finalized.`;
  const closing = "Please review the schedule for your rehearsal dates, times, and scenes. Contact the director or stage manager if you have a conflict.";

  return {
    subject: `${productionName} rehearsal schedule is ready`,
    text: [
      `Hi ${recipientName},`,
      "",
      `The rehearsal schedule for ${productionName} has been finalized.`,
      "",
      `View the schedule: ${scheduleUrl}`,
      "",
      "Please review your rehearsal dates, times, and scenes. Contact the director or stage manager if you have a conflict.",
    ].join("\n"),
    html: renderEmail({
      title,
      message,
      actionLabel: "View rehearsal schedule",
      actionUrl: scheduleUrl,
      closing,
    }),
  };
}
