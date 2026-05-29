import { listEvents } from '../lib/data.js';
import { formatRange } from '../lib/format.js';
import SignupForm from './SignupForm.js';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
  const view = searchParams?.view === 'office-hours' ? 'office-hours' : 'dinners';
  const type = view === 'office-hours' ? 'office_hours' : 'dinner';
  const events = await listEvents(type);

  return (
    <main>
      <h1>Sign Up</h1>
      <p className="subtitle">Reserve your spot for dinners and office hours. All times are Eastern.</p>

      <nav className="tabs">
        <a href="/?view=dinners" className={view === 'dinners' ? 'active' : ''}>
          Dinners
        </a>
        <a href="/?view=office-hours" className={view === 'office-hours' ? 'active' : ''}>
          Office Hours
        </a>
      </nav>

      {events.length === 0 ? (
        <p className="empty">
          {view === 'dinners'
            ? 'No dinners are open for sign-up right now. Check back soon!'
            : 'No office-hour slots are open right now. Check back soon!'}
        </p>
      ) : (
        events.map((e) => <EventCard key={e.id} event={e} />)
      )}

      <p className="footer-link">
        <a href="/admin">Admin</a>
      </p>
    </main>
  );
}

function EventCard({ event }) {
  const remaining = event.capacity - event.taken;
  const isFull = remaining <= 0;
  const unavailable = event.is_closed || isFull;

  return (
    <div className={`card ${unavailable ? 'closed' : ''}`}>
      <div className="row">
        <div>
          <div className="title">{event.title}</div>
          <div className="meta">{formatRange(event.starts_at, event.ends_at)}</div>
          {event.location && <div className="meta">📍 {event.location}</div>}
        </div>
        <SeatBadge event={event} remaining={remaining} isFull={isFull} />
      </div>

      {event.description && <div className="desc">{event.description}</div>}

      {event.is_closed ? (
        <p className="note">Sign-ups are closed.</p>
      ) : isFull ? (
        <p className="note">This one is full.</p>
      ) : (
        <SignupForm eventId={event.id} kind={event.type} />
      )}
    </div>
  );
}

function SeatBadge({ event, remaining, isFull }) {
  if (event.is_closed) return <span className="badge closed">Closed</span>;
  if (isFull) return <span className="badge full">Full</span>;
  if (event.type === 'office_hours') {
    return <span className="badge">Available</span>;
  }
  return (
    <span className="badge">
      {remaining} of {event.capacity} seat{event.capacity === 1 ? '' : 's'} left
    </span>
  );
}
