import nodemailer from 'nodemailer';

// Reuses the same Gmail app-password approach as the rest of this repo.
// If email isn't configured we just skip sending rather than failing a signup.
function getTransport() {
  const user = process.env.GMAIL_SENDER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendConfirmationEmail({ to, name, event, cancelUrl }) {
  const transport = getTransport();
  if (!transport) {
    console.warn('Email not configured; skipping confirmation to', to);
    return;
  }

  const when = formatWhen(event);
  const where = event.location ? `\nWhere: ${event.location}` : '';
  const kind = event.type === 'dinner' ? 'dinner' : 'office hours';

  const text = [
    `Hi ${name},`,
    '',
    `You're confirmed for ${event.title} (${kind}).`,
    `When: ${when}${where}`,
    '',
    `Need to cancel? Use this link and your spot opens up for someone else:`,
    cancelUrl,
    '',
    'See you there!',
  ].join('\n');

  await transport.sendMail({
    from: process.env.GMAIL_SENDER,
    to,
    subject: `Confirmed: ${event.title}`,
    text,
  });
}

function formatWhen(event) {
  const tz = 'America/New_York';
  const start = new Date(event.starts_at);
  const dateStr = start.toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  if (event.ends_at) {
    const end = new Date(event.ends_at);
    const endStr = end.toLocaleString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} – ${endStr} (Eastern)`;
  }
  return `${dateStr} (Eastern)`;
}
