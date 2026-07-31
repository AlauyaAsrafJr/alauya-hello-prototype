export function formatYearLevel(year: number | null | undefined): string {
  if (!year) return '—';
  const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th';
  return `${year}${suffix} Year`;
}

export const YEAR_LEVEL_OPTIONS = [1, 2, 3, 4].map((year) => ({
  value: String(year),
  label: formatYearLevel(year),
}));
