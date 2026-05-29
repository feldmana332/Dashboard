'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRange } from '../../lib/format.js';

export default function AdminDashboard({ dinners, officeHours }) {
  const router = useRouter();
  const [tab, setTab] = useState('dinners');
  const [busy, setBusy] = useState(false);

  async function action(payload) {
    setBusy(true);
    const res = await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return true;
    }
    alert('That action failed. Please try again.');
    return false;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <nav className="tabs" style={{ margin: 0 }}>
          <a
            href="#"
            className={tab === 'dinners' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setTab('dinners'); }}
          >
            Dinners
          </a>
          <a
            href="#"
            className={tab === 'office' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setTab('office'); }}
          >
            Office Hours
          </a>
        </nav>
        <span className="spacer" />
        <button className="btn secondary" onClick={logout}>Sign out</button>
      </div>

      {tab === 'dinners' ? (
        <>
          <DinnerForm action={action} busy={busy} />
          <div className="toolbar">
            <h2 style={{ margin: '24px 0 0' }}>Dinners</h2>
            <span className="spacer" />
            <a className="btn secondary" href="/api/admin/export?type=dinner">Export CSV</a>
          </div>
          <EventList events={dinners} action={action} busy={busy} kind="dinner" />
        </>
      ) : (
        <>
          <OfficeHoursForm action={action} busy={busy} />
          <div className="toolbar">
            <h2 style={{ margin: '24px 0 0' }}>Office-hour slots</h2>
            <span className="spacer" />
            <a className="btn secondary" href="/api/admin/export?type=office_hours">Export CSV</a>
          </div>
          <EventList events={officeHours} action={action} busy={busy} kind="office_hours" />
        </>
      )}
    </div>
  );
}

function DinnerForm({ action, busy }) {
  const [f, setF] = useState({ title: '', datetime: '', location: '', capacity: '8', description: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const ok = await action({ action: 'create-dinner', ...f });
    if (ok) setF({ title: '', datetime: '', location: '', capacity: '8', description: '' });
  }

  return (
    <form className="card" onSubmit={submit}>
      <strong>Add a dinner</strong>
      <label>Title</label>
      <input value={f.title} onChange={set('title')} placeholder="Friday Group Dinner" required />
      <div className="signup-form" style={{ border: 0, padding: 0 }}>
        <div className="grid">
          <div>
            <label>Date &amp; time</label>
            <input type="datetime-local" value={f.datetime} onChange={set('datetime')} required />
          </div>
          <div>
            <label>Seats</label>
            <input type="number" min="1" value={f.capacity} onChange={set('capacity')} required />
          </div>
        </div>
      </div>
      <label>Location</label>
      <input value={f.location} onChange={set('location')} placeholder="e.g. Casa Mia, 7pm" />
      <label>Notes (optional)</label>
      <textarea value={f.description} onChange={set('description')} rows={2} placeholder="Anything students should know" />
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>Add dinner</button>
      </div>
    </form>
  );
}

function OfficeHoursForm({ action, busy }) {
  const [f, setF] = useState({
    title: 'Office Hours', date: '', start: '14:00', end: '16:00', increment: '20', capacity: '1', location: '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const res = await action({ action: 'create-office-hours', ...f });
    if (res) setF({ ...f, date: '' });
  }

  return (
    <form className="card" onSubmit={submit}>
      <strong>Generate office-hour slots</strong>
      <p className="hint">Set a window and slot length; the slots are created for you. One student per slot.</p>
      <label>Label</label>
      <input value={f.title} onChange={set('title')} placeholder="Office Hours" required />
      <div className="signup-form" style={{ border: 0, padding: 0 }}>
        <div className="grid">
          <div>
            <label>Date</label>
            <input type="date" value={f.date} onChange={set('date')} required />
          </div>
          <div>
            <label>Slot length</label>
            <select value={f.increment} onChange={set('increment')}>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <div>
            <label>Start time</label>
            <input type="time" value={f.start} onChange={set('start')} required />
          </div>
          <div>
            <label>End time</label>
            <input type="time" value={f.end} onChange={set('end')} required />
          </div>
        </div>
      </div>
      <label>Location (optional)</label>
      <input value={f.location} onChange={set('location')} placeholder="e.g. Zoom, or Room 214" />
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>Generate slots</button>
      </div>
    </form>
  );
}

function EventList({ events, action, busy, kind }) {
  if (events.length === 0) {
    return <p className="empty">Nothing created yet.</p>;
  }
  return events.map((e) => (
    <AdminEventCard key={e.id} event={e} action={action} busy={busy} kind={kind} />
  ));
}

function AdminEventCard({ event, action, busy, kind }) {
  const [open, setOpen] = useState(false);
  const remaining = event.capacity - event.taken;

  async function confirmDelete() {
    if (window.confirm(`Delete "${event.title}"? This removes its sign-ups too.`)) {
      await action({ action: 'delete', id: event.id });
    }
  }

  return (
    <div className={`card ${event.is_closed ? 'closed' : ''}`}>
      <div className="row">
        <div>
          <div className="title">{event.title}</div>
          <div className="meta">{formatRange(event.starts_at, event.ends_at)}</div>
          {event.location && <div className="meta">📍 {event.location}</div>}
        </div>
        <span className={`badge ${event.is_closed ? 'closed' : remaining <= 0 ? 'full' : ''}`}>
          {event.is_closed ? 'Closed' : `${event.taken} / ${event.capacity} taken`}
        </span>
      </div>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn secondary" onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'View'} sign-ups ({event.taken})
        </button>
        {event.is_closed ? (
          <button className="btn secondary" disabled={busy} onClick={() => action({ action: 'reopen', id: event.id })}>
            Reopen
          </button>
        ) : (
          <button className="btn secondary" disabled={busy} onClick={() => action({ action: 'close', id: event.id })}>
            Close
          </button>
        )}
        <button className="btn danger" disabled={busy} onClick={confirmDelete}>Delete</button>
      </div>

      {open && (
        event.reservations.length === 0 ? (
          <p className="empty">No sign-ups yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th></tr>
            </thead>
            <tbody>
              {event.reservations.map((r) => (
                <tr key={r.id}><td>{r.name}</td><td>{r.email}</td></tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
