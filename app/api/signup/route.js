import { NextResponse } from 'next/server';
import { createReservation } from '../../../lib/data.js';
import { sendConfirmationEmail } from '../../../lib/email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteUrl(req) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  );
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const eventId = Number(body.eventId);

  if (!name || !EMAIL_RE.test(email) || !Number.isInteger(eventId)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const result = await createReservation({ eventId, name, email });
  if (result.error) {
    const status = result.error === 'not_found' ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  const cancelUrl = `${siteUrl(req)}/cancel?token=${result.cancelToken}`;
  // Don't fail the signup if the email can't be sent.
  try {
    await sendConfirmationEmail({ to: email, name, event: result.event, cancelUrl });
  } catch (err) {
    console.error('Confirmation email failed:', err.message);
  }

  return NextResponse.json({ ok: true });
}
