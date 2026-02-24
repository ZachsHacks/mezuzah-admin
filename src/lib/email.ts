import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const TO = () => process.env.NOTIFICATION_EMAIL ?? '';
const FROM = () => process.env.NOTIFICATION_FROM ?? 'onboarding@resend.dev';

export async function sendSubmittedEmail(changeDescription: string) {
  const resend = getResend();
  if (!resend || !TO()) return;

  await resend.emails.send({
    from: FROM(),
    to: TO(),
    subject: '✅ Mezuzah changes submitted — going live soon',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1e3a58;">
        <h2 style="color: #1a7fd4; margin-bottom: 8px;">✡ Made in Heaven Mezuzahs</h2>
        <p style="color: #3d6a96; font-size: 0.9rem; margin-bottom: 24px;">Admin Notification</p>
        <p>Your changes have been saved and submitted to the website:</p>
        <blockquote style="border-left: 3px solid #4499d4; padding-left: 16px; color: #3d6a96; margin: 16px 0;">
          ${changeDescription}
        </blockquote>
        <p>The website will update in approximately <strong>1–2 minutes</strong>.</p>
        <p>You'll receive another email once the changes are confirmed live.</p>
        <hr style="border: none; border-top: 1px solid #e0eaf5; margin: 24px 0;" />
        <p style="font-size: 0.8rem; color: #8aacc8;">Sent by Made in Heaven Mezuzahs Admin Panel</p>
      </div>
    `,
  });
}

export async function sendCustomOrderEmail(order: {
  name: string;
  contact: string;
  description: string;
  size?: string;
  details?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const sizeRow = order.size
    ? `<tr><td style="padding:8px 0;font-weight:bold;color:#1e3a58;width:140px;">Size:</td><td style="padding:8px 0;color:#2d5070;">${order.size}</td></tr>`
    : '';
  const detailsRow = order.details
    ? `<tr><td style="padding:8px 0;font-weight:bold;color:#1e3a58;vertical-align:top;">Details:</td><td style="padding:8px 0;color:#2d5070;">${order.details}</td></tr>`
    : '';

  await resend.emails.send({
    from: FROM(),
    to: 'weiss.sorah@gmail.com',
    subject: '🎨 New Custom Order Request — Made in Heaven Mezuzahs',
    html: `
      <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:32px;color:#1e3a58;">
        <h2 style="color:#1a7fd4;margin-bottom:8px;">✡ Made in Heaven Mezuzahs</h2>
        <p style="color:#3d6a96;font-size:0.9rem;margin-bottom:24px;">New Custom Order Request from the Website</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:bold;color:#1e3a58;width:140px;">Name:</td><td style="padding:8px 0;color:#2d5070;">${order.name}</td></tr>
          <tr><td style="padding:8px 0;font-weight:bold;color:#1e3a58;">Phone/Email:</td><td style="padding:8px 0;color:#2d5070;">${order.contact}</td></tr>
          ${sizeRow}
          <tr><td style="padding:8px 0;font-weight:bold;color:#1e3a58;vertical-align:top;">Vision:</td><td style="padding:8px 0;color:#2d5070;">${order.description}</td></tr>
          ${detailsRow}
        </table>
        <hr style="border:none;border-top:1px solid #e0eaf5;margin:24px 0;" />
        <p style="font-size:0.8rem;color:#8aacc8;">Sent by Made in Heaven Mezuzahs Website</p>
      </div>
    `,
  });
}

export async function sendLiveEmail() {
  const resend = getResend();
  if (!resend || !TO()) return;

  await resend.emails.send({
    from: FROM(),
    to: TO(),
    subject: '🎉 Your mezuzah website is updated and live!',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #1e3a58;">
        <h2 style="color: #1a7fd4; margin-bottom: 8px;">✡ Made in Heaven Mezuzahs</h2>
        <p style="color: #3d6a96; font-size: 0.9rem; margin-bottom: 24px;">Admin Notification</p>
        <p style="font-size: 1.1rem;">🎉 Your changes are <strong>live on the website!</strong></p>
        <p>Visitors can now see the updated collection.</p>
        <hr style="border: none; border-top: 1px solid #e0eaf5; margin: 24px 0;" />
        <p style="font-size: 0.8rem; color: #8aacc8;">Sent by Made in Heaven Mezuzahs Admin Panel</p>
      </div>
    `,
  });
}
