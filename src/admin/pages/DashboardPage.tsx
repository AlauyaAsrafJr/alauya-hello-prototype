import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AdminAnalytics, ReportRecord, SystemStatistics } from '../../api/domain';
import { PlayersIcon, CoachesIcon, ActivitiesIcon, AttendanceIcon, ArchiveIcon, ReportsIcon, UsersIcon, StarIcon } from '../../icons';

interface DashboardPageProps {
  onNavigate: (key: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [reports, setReports] = useState<ReportRecord[] | null>(null);

  useEffect(() => {
    api.get<AdminAnalytics>('/admin/analytics').then(setAnalytics);
    api.get<SystemStatistics>('/admin/statistics').then(setStats);
    api.get<ReportRecord[]>('/admin/reports').then((r) => setReports(r.slice(0, 5)));
  }, []);

  if (!analytics || !stats) return <div className="card-body">Loading dashboard…</div>;

  const cards = [
    { label: 'Total Players', value: analytics.total_players, Icon: PlayersIcon, onView: () => onNavigate('players') },
    { label: 'Total Coaches', value: analytics.total_coaches, Icon: CoachesIcon, onView: () => onNavigate('users') },
    { label: 'Training Activities', value: analytics.total_activities, Icon: ActivitiesIcon, onView: () => onNavigate('attendance') },
    { label: 'Attendance Rate', value: `${analytics.attendance_rate}%`, Icon: AttendanceIcon, onView: () => onNavigate('attendance') },
    { label: 'Active Users', value: stats.active_users, Icon: UsersIcon, onView: () => onNavigate('users') },
    { label: 'Average Rating', value: analytics.average_rating != null ? analytics.average_rating.toFixed(1) : '—', Icon: StarIcon, onView: () => onNavigate('reports') },
    { label: 'Archived Records', value: stats.archived_records, Icon: ArchiveIcon, onView: () => onNavigate('archive') },
    { label: 'Pending Reports', value: stats.pending_reports, Icon: ReportsIcon, onView: () => onNavigate('reports') },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map((c) => (
          <div key={c.label} className="card elev-sm" style={{ padding: 18 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: 'var(--color-accent-100)',
                color: 'var(--color-accent-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <c.Icon />
            </div>
            <div className="card-title" style={{ fontSize: 28, marginTop: 6 }}>{c.value}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, fontWeight: 600 }}>{c.label}</div>
            <button type="button" onClick={c.onView} className="btn btn-ghost" style={{ paddingInline: 0, marginTop: 2, fontSize: 12.5 }}>
              Quick view →
            </button>
          </div>
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 20, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="card-title">Recent reports</div>
          <button type="button" onClick={() => onNavigate('reports')} className="btn btn-ghost" style={{ paddingInline: 0, fontSize: 12.5 }}>
            View all →
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reports?.map((r) => (
            <div key={r.report_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, textTransform: 'capitalize' }}>{r.report_type} report</div>
                <div style={{ fontSize: 11.5, opacity: 0.55 }}>{new Date(r.generated_date).toLocaleDateString()} · {r.generated_by_name}</div>
              </div>
              <span className={r.status === 'approved' ? 'tag tag-accent' : 'tag tag-outline'}>{r.status}</span>
            </div>
          ))}
          {reports && reports.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>No reports yet.</div>}
        </div>
      </div>
    </>
  );
}
