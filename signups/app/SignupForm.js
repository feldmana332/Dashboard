'use client';

import { useState } from 'react';

const MESSAGES = {
  full: 'Sorry — that filled up. Try another option.',
  closed: 'Sign-ups for this are closed.',
  not_found: 'That option is no longer available.',
  invalid: 'Please enter your name and a valid email.',
  error: 'Something went wrong. Please try again.',
};

export default function SignupForm({ eventId, kind }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle' });

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState({ status: 'done' });
      } else {
        setState({ status: 'error', message: MESSAGES[data.error] || MESSAGES.error });
      }
    } catch {
      setState({ status: 'error', message: MESSAGES.error });
    }
  }

  if (state.status === 'done') {
    return (
      <p className="note ok">
        You&apos;re signed up! A confirmation (with a cancel link) is on its way to your email.
      </p>
    );
  }

  const namePlaceholder =
    kind === 'office_hours' ? 'Your name (or "Name — Group 2")' : 'Your name';

  return (
    <form className="signup-form" onSubmit={submit}>
      <div className="grid">
        <div>
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            required
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Signing up…' : 'Sign me up'}
        </button>
      </div>
      {state.status === 'error' && <p className="note err">{state.message}</p>}
    </form>
  );
}
