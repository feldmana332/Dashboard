// Everything is shown in Eastern time so nobody books "their" time zone.
const TZ = 'America/New_York';

export function formatDate(value) {
  return new Date(value).toLocaleString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRange(start, end) {
  if (!end) return `${formatDate(start)} · ${formatTime(start)}`;
  return `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}`;
}

// Convert a wall-clock "YYYY-MM-DDTHH:mm" entered by the admin (interpreted as
// Eastern time) into a real UTC Date. Handles EST/EDT automatically.
export function easternLocalToUTC(localString) {
  // localString like "2026-06-01T18:30"
  const [datePart, timePart] = localString.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);

  // Build a UTC date from the components, then figure out Eastern's offset for
  // that instant and correct for it.
  const asUTC = Date.UTC(y, mo - 1, d, h, mi);
  const offsetMinutes = easternOffsetMinutes(new Date(asUTC));
  return new Date(asUTC - offsetMinutes * 60 * 1000);
}

// Offset of America/New_York from UTC, in minutes, for a given instant.
// EDT = -240, EST = -300.
function easternOffsetMinutes(date) {
  const tzName = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;
  return tzName === 'EDT' ? -240 : -300;
}
