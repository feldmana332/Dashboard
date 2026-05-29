'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError('Incorrect password.');
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 360 }}>
      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
      />
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </div>
      {error && <p className="note err">{error}</p>}
    </form>
  );
}
