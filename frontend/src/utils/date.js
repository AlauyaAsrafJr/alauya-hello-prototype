// Parses the date part as local Y/M/D (not UTC) so a date-only string like
// "2026-09-10" never shifts a day backward depending on the viewer's timezone.
export function formatLongDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatLongDateTime(isoDateTime) {
  if (!isoDateTime) return '';
  return new Date(isoDateTime).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
