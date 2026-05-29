import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth.js';
import { easternLocalToUTC } from '../../../../lib/format.js';
import {
  createEvent,
  createSlots,
  setClosed,
  deleteEvent,
} from '../../../../lib/data.js';

export async function POST(req) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  try {
    switch (body.action) {
      case 'create-dinner':
        return await createDinner(body);
      case 'create-office-hours':
        return await createOfficeHours(body);
      case 'close':
        await setClosed(Number(body.id), true);
        return NextResponse.json({ ok: true });
      case 'reopen':
        await setClosed(Number(body.id), false);
        return NextResponse.json({ ok: true });
      case 'delete':
        await deleteEvent(Number(body.id));
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Admin action failed:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

async function createDinner(body) {
  const title = (body.title || '').trim();
  const capacity = parseInt(body.capacity, 10);
  if (!title || !body.datetime || !Number.isInteger(capacity) || capacity < 1) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const event = await createEvent({
    type: 'dinner',
    title,
    description: (body.description || '').trim(),
    location: (body.location || '').trim(),
    starts_at: easternLocalToUTC(body.datetime),
    capacity,
  });
  return NextResponse.json({ ok: true, id: event.id });
}

async function createOfficeHours(body) {
  const label = (body.title || '').trim() || 'Office Hours';
  const increment = parseInt(body.increment, 10);
  const capacity = parseInt(body.capacity, 10) || 1;
  if (!body.date || !body.start || !body.end || !Number.isInteger(increment) || increment < 5) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const startUTC = easternLocalToUTC(`${body.date}T${body.start}`);
  const endUTC = easternLocalToUTC(`${body.date}T${body.end}`);
  if (endUTC <= startUTC) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const slots = [];
  const stepMs = increment * 60 * 1000;
  for (let t = startUTC.getTime(); t + stepMs <= endUTC.getTime() + 1; t += stepMs) {
    slots.push({
      title: label,
      location: (body.location || '').trim(),
      starts_at: new Date(t),
      ends_at: new Date(t + stepMs),
      capacity,
      series_label: label,
    });
  }

  if (slots.length === 0) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  await createSlots(slots);
  return NextResponse.json({ ok: true, count: slots.length });
}
