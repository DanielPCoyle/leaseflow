import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@leaseflow.app";

/**
 * Send a tour confirmation email to a prospect.
 * Silently no-ops if RESEND_API_KEY is not configured (dev mode).
 */
export async function sendTourConfirmation(params: {
  to: string;
  prospectName: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhone: string | null;
  agentName: string | null;
  scheduledDate: string; // ISO string or YYYY-MM-DD
  scheduledTime: string; // HH:MM
  tourType: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[email] Resend not configured, skipping:", params.to);
    return { success: true };
  }

  const dateObj = new Date(params.scheduledDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = formatTime(params.scheduledTime);
  const tourTypeLabel = params.tourType.replace(/_/g, " ").toLowerCase();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Tour Confirmed: ${params.propertyName} on ${formattedDate}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Tour Confirmation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #2563eb; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Tour Confirmed!</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #1a1a2e; margin: 0 0 16px;">Hi ${params.prospectName},</p>
        <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
          Your tour at <strong style="color: #1a1a2e;">${params.propertyName}</strong> is confirmed.
          We're looking forward to showing you around!
        </p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="margin-bottom: 12px;">
            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Date</div>
            <div style="color: #1a1a2e; font-size: 15px; font-weight: 500;">${formattedDate}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Time</div>
            <div style="color: #1a1a2e; font-size: 15px; font-weight: 500;">${formattedTime}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Tour Type</div>
            <div style="color: #1a1a2e; font-size: 15px; font-weight: 500; text-transform: capitalize;">${tourTypeLabel}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Location</div>
            <div style="color: #1a1a2e; font-size: 15px; font-weight: 500;">${params.propertyAddress}</div>
          </div>
          ${params.agentName ? `
          <div>
            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Your Agent</div>
            <div style="color: #1a1a2e; font-size: 15px; font-weight: 500;">${params.agentName}</div>
          </div>
          ` : ""}
        </div>

        ${params.propertyPhone ? `
        <p style="font-size: 14px; color: #64748b; margin: 0 0 8px;">
          Questions? Call us at <a href="tel:${params.propertyPhone}" style="color: #2563eb; text-decoration: none;">${params.propertyPhone}</a>
        </p>
        ` : ""}

        <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
          Need to reschedule? Reply to this email and we'll find a new time that works for you.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <div style="color: #64748b; font-size: 12px;">Powered by LeaseFlow</div>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });

    return { success: true };
  } catch (error) {
    console.error("[email] Failed to send tour confirmation:", error);
    return { success: false, error: String(error) };
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
