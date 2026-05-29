import crypto from 'crypto';
import { query, withTransaction } from './db.js';

// --- Public reads ---

// Upcoming events of a type, with a count of how many seats are taken.
export async function listEvents(type, { includePast = false } = {}) {
  const params = [type];
  let timeFilter = '';
  if (!includePast) {
    timeFilter = `and coalesce(e.ends_at, e.starts_at) >= now() - interval '1 hour'`;
  }
  const { rows } = await query(
    `select e.*,
            (select count(*)::int from reservations r where r.event_id = e.id) as taken
       from events e
      where e.type = $1 ${timeFilter}
      order by e.starts_at asc`,
    params
  );
  return rows;
}

export async function getEvent(id) {
  const { rows } = await query(
    `select e.*,
            (select count(*)::int from reservations r where r.event_id = e.id) as taken
       from events e where e.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// --- Sign up (capacity-safe) ---

export async function createReservation({ eventId, name, email }) {
  return withTransaction(async (client) => {
    // Lock the event row so two concurrent signups can't both take the last seat.
    const { rows } = await client.query(
      `select id, type, title, location, starts_at, ends_at, capacity, is_closed
         from events where id = $1 for update`,
      [eventId]
    );
    const event = rows[0];
    if (!event) return { error: 'not_found' };
    if (event.is_closed) return { error: 'closed' };

    const { rows: countRows } = await client.query(
      `select count(*)::int as taken from reservations where event_id = $1`,
      [eventId]
    );
    if (countRows[0].taken >= event.capacity) return { error: 'full' };

    const cancelToken = crypto.randomBytes(24).toString('hex');
    await client.query(
      `insert into reservations (event_id, name, email, cancel_token)
       values ($1, $2, $3, $4)`,
      [eventId, name, email, cancelToken]
    );
    return { event, cancelToken };
  });
}

export async function cancelByToken(token) {
  const { rows } = await query(
    `delete from reservations where cancel_token = $1 returning event_id`,
    [token]
  );
  return rows.length > 0;
}

// --- Admin ---

export async function createEvent(data) {
  const { rows } = await query(
    `insert into events (type, title, description, location, starts_at, ends_at, capacity, series_label)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [
      data.type,
      data.title,
      data.description || '',
      data.location || '',
      data.starts_at,
      data.ends_at || null,
      data.capacity || 1,
      data.series_label || '',
    ]
  );
  return rows[0];
}

// Insert many office-hour slots in one go.
export async function createSlots(slots) {
  if (slots.length === 0) return 0;
  return withTransaction(async (client) => {
    for (const s of slots) {
      await client.query(
        `insert into events (type, title, description, location, starts_at, ends_at, capacity, series_label)
         values ('office_hours', $1, '', $2, $3, $4, $5, $6)`,
        [s.title, s.location || '', s.starts_at, s.ends_at, s.capacity || 1, s.series_label || '']
      );
    }
    return slots.length;
  });
}

export async function setClosed(id, closed) {
  await query(`update events set is_closed = $2 where id = $1`, [id, closed]);
}

export async function deleteEvent(id) {
  await query(`delete from events where id = $1`, [id]);
}

export async function listReservations(eventId) {
  const { rows } = await query(
    `select id, name, email, created_at from reservations
      where event_id = $1 order by created_at asc`,
    [eventId]
  );
  return rows;
}

// Admin view: every event of a type (including past), each with its sign-ups.
export async function adminEvents(type) {
  const { rows: events } = await query(
    `select e.* from events e where e.type = $1 order by e.starts_at asc`,
    [type]
  );
  if (events.length === 0) return [];
  const ids = events.map((e) => e.id);
  const { rows: res } = await query(
    `select id, event_id, name, email, created_at from reservations
      where event_id = any($1::bigint[]) order by created_at asc`,
    [ids]
  );
  const byEvent = new Map();
  for (const r of res) {
    if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, []);
    byEvent.get(r.event_id).push(r);
  }
  return events.map((e) => ({
    ...e,
    reservations: byEvent.get(e.id) || [],
    taken: (byEvent.get(e.id) || []).length,
  }));
}

// All reservations joined to their event — used for CSV export.
export async function allReservations(type) {
  const params = [];
  let filter = '';
  if (type) {
    params.push(type);
    filter = `where e.type = $1`;
  }
  const { rows } = await query(
    `select e.type, e.title, e.location, e.starts_at, e.ends_at,
            r.name, r.email, r.created_at
       from reservations r
       join events e on e.id = r.event_id
       ${filter}
      order by e.starts_at asc, r.created_at asc`,
    params
  );
  return rows;
}
