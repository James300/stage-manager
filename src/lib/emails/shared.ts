export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmail({
  title,
  message,
  actionLabel,
  actionUrl,
  closing,
}: {
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  closing?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeClosing = closing ? escapeHtml(closing) : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f4;color:#292524;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:8px;">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 24px;color:#78716c;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Stage Manager</p>
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${safeTitle}</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">${safeMessage}</p>
            <p style="margin:0 0 24px;"><a href="${safeActionUrl}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:#292524;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">${safeActionLabel}</a></p>
            ${safeClosing ? `<p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6;">${safeClosing}</p>` : ""}
            <p style="margin:0;color:#78716c;font-size:14px;line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${safeActionUrl}" style="color:#57534e;word-break:break-all;">${safeActionUrl}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
