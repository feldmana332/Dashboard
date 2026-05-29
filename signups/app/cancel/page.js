import { cancelByToken } from '../../lib/data.js';

export const dynamic = 'force-dynamic';

export default async function CancelPage({ searchParams }) {
  const token = searchParams?.token;
  let outcome = 'missing';

  if (token) {
    const ok = await cancelByToken(token);
    outcome = ok ? 'cancelled' : 'notfound';
  }

  return (
    <main>
      <h1>Cancel reservation</h1>
      <div className="card">
        {outcome === 'cancelled' && (
          <p className="note ok">
            Done — your reservation has been cancelled and your spot is open for someone else.
          </p>
        )}
        {outcome === 'notfound' && (
          <p className="note err">
            We couldn&apos;t find that reservation. It may already have been cancelled.
          </p>
        )}
        {outcome === 'missing' && (
          <p className="note err">This cancel link looks incomplete.</p>
        )}
      </div>
      <p className="footer-link">
        <a href="/">← Back to sign-ups</a>
      </p>
    </main>
  );
}
