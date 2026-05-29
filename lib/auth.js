import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';

function sign(value) {
  const secret = process.env.SESSION_SECRET || 'insecure-dev-secret';
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

// The cookie value is "ok.<hmac>" — opaque but verifiable, so it can't be forged
// without SESSION_SECRET. We don't store the password in the cookie.
export function makeSessionToken() {
  const payload = 'ok';
  return `${payload}.${sign(payload)}`;
}

export function isValidToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, mac] = token.split('.');
  if (payload !== 'ok') return false;
  const expected = sign(payload);
  // constant-time compare
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(password || '');
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return isValidToken(token);
}

export const SESSION_COOKIE = COOKIE_NAME;
