import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { PlayersIcon, CoachesIcon, ActivitiesIcon, AttendanceIcon, ArchiveIcon, ReportsIcon, UsersIcon, StarIcon } from '../../icons';
import { StatCard } from '../../components/StatCard';

export function DashboardPage({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(setAnalytics);
    api.get('/admin/statistics').then(setStats);
    api.get('/admin/reports').then((r) => setReports(r.slice(0, 5)));
  }, []);

  if (!analytics || !stats) return <div className="card-body">Loading dashboard…</div>;

  const cards = [
    { label: 'Total Players', value: analytics.total_players, Icon: PlayersIcon, variant: 'info', onView: () => onNavigate('players') },
    { label: 'Total Coaches', value: analytics.total_coaches, Icon: CoachesIcon, variant: 'accent', onView: () => onNavigate('users') },
    {
      label: 'Training Activities',
      value: analytics.total_activities,
      Icon: ActivitiesIcon,
      variant: 'success',
      onView: () => onNavigate('attendance'),
    },
    {
      label: 'Attendance Rate',
      value: `${analytics.attendance_rate}%`,
      Icon: AttendanceIcon,
      variant: 'warning',
      onView: () => onNavigate('attendance'),
    },
    { label: 'Active Users', value: stats.active_users, Icon: UsersIcon, variant: 'info', onView: () => onNavigate('users') },
    {
      label: 'Average Rating',
      value: analytics.average_rating != null ? analytics.average_rating.toFixed(1) : '—',
      Icon: StarIcon,
      variant: 'accent',
      onView: () => onNavigate('reports'),
    },
    {
      label: 'Archived Records',
      value: stats.archived_records,
      Icon: ArchiveIcon,
      variant: 'success',
      onView: () => onNavigate('archive'),
    },
    { label: 'Pending Reports', value: stats.pending_reports, Icon: ReportsIcon, variant: 'warning', onView: () => onNavigate('reports') },
  ];

  return (
    <>
      <div className="stat-grid-4" style={{ marginBottom: 28 }}>
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.Icon} variant={c.variant} onView={c.onView} />
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 20, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="card-title">Recent reports</div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="btn btn-ghost"
            style={{ paddingInline: 0, fontSize: 12.5 }}
          >
            View all →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reports?.map((r) => (
            <div
              key={r.report_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, textTransform: 'capitalize' }}>{r.report_type} report</div>
                <div style={{ fontSize: 11.5, opacity: 0.55 }}>
                  {new Date(r.generated_date).toLocaleDateString()} · {r.generated_by_name}
                </div>
              </div>
              <span className={r.status === 'approved' ? 'tag tag-success' : 'tag tag-warning'}>{r.status}</span>
            </div>
          ))}
          {reports && reports.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>No reports yet.</div>}
        </div>
      </div>
    </>
  );
}
