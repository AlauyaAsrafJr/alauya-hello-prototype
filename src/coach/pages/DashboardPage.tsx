import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CoachAnalytics } from '../../api/domain';
import { PlayersIcon, ActivitiesIcon, AttendanceIcon, StarIcon } from '../../icons';
import { StatCard, type StatCardVariant } from '../../components/StatCard';

interface DashboardPageProps {
  onNavigate: (key: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);

  useEffect(() => {
    api.get<CoachAnalytics>('/coach/analytics').then(setAnalytics);
  }, []);

  if (!analytics) return <div className="card-body">Loading analytics…</div>;

  const cards: { label: string; value: string | number; Icon: typeof PlayersIcon; variant: StatCardVariant; onView: () => void }[] = [
    { label: 'Total Players', value: analytics.total_players, Icon: PlayersIcon, variant: 'info', onView: () => onNavigate('players') },
    { label: 'Training Activities', value: analytics.total_activities, Icon: ActivitiesIcon, variant: 'success', onView: () => onNavigate('activities') },
    { label: 'Attendance Rate', value: `${analytics.attendance_rate}%`, Icon: AttendanceIcon, variant: 'warning', onView: () => onNavigate('attendance') },
    { label: 'Average Rating', value: analytics.average_rating != null ? analytics.average_rating.toFixed(1) : '—', Icon: StarIcon, variant: 'accent', onView: () => onNavigate('feedback') },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.Icon} variant={c.variant} onView={c.onView} />
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>Participation by activity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {analytics.participation_by_activity.map((row) => (
            <div key={row.activity_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
              <span>{row.activity_name}</span>
              <span style={{ fontWeight: 600 }}>{row.participants} players</span>
            </div>
          ))}
          {analytics.participation_by_activity.length === 0 && (
            <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>No activity data yet.</div>
          )}
        </div>
      </div>
    </>
  );
}
