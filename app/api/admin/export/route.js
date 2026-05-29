import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/auth.js';
import { allReservations } from '../../../../lib/data.js';

export const dynamic = 'force-dynamic';

function csvCell(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const typeParam = req.nextUrl.searchParams.get('type');
  const type = typeParam === 'dinner' || typeParam === 'office_hours' ? typeParam : null;
  const rows = await allReservations(type);

  const tz = 'America/New_York';
  const fmt = (d) =>
    d ? new Date(d).toLocaleString('en-US', { timeZone: tz }) : '';

  const header = ['Type', 'Event', 'Location', 'When', 'Name', 'Email', 'Signed up'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.type,
        r.title,
        r.location,
        fmt(r.starts_at),
        r.name,
        r.email,
        fmt(r.created_at),
      ]
        .map(csvCell)
        .join(',')
    );
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="signups-${type || 'all'}.csv"`,
    },
  });
}
