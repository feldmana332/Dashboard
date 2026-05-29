import { isAdmin } from '../../lib/auth.js';
import { adminEvents } from '../../lib/data.js';
import AdminLogin from './AdminLogin.js';
import AdminDashboard from './AdminDashboard.js';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isAdmin()) {
    return (
      <main>
        <h1>Admin</h1>
        <p className="subtitle">Enter the shared admin password to manage sign-ups.</p>
        <AdminLogin />
      </main>
    );
  }

  const [dinners, officeHours] = await Promise.all([
    adminEvents('dinner'),
    adminEvents('office_hours'),
  ]);

  // Serialize dates to strings so they cross the server→client boundary cleanly.
  const serialize = (e) => ({
    ...e,
    starts_at: e.starts_at.toISOString(),
    ends_at: e.ends_at ? e.ends_at.toISOString() : null,
    created_at: e.created_at.toISOString(),
    reservations: e.reservations.map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
    })),
  });

  return (
    <main>
      <h1>Admin</h1>
      <p className="subtitle">Create, close, and review sign-ups. All times are Eastern.</p>
      <AdminDashboard
        dinners={dinners.map(serialize)}
        officeHours={officeHours.map(serialize)}
      />
    </main>
  );
}
