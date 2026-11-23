import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { PlayersIcon, CoachesIcon, ActivitiesIcon, AttendanceIcon, ArchiveIcon, ReportsIcon, UsersIcon, StarIcon } from '../../icons';
import { StatCard } from '../../components/StatCard';
import { LineTrendChart } from '../../components/charts/LineTrendChart';
import { RankedBarChart } from '../../components/charts/RankedBarChart';

function computeAttendanceTrend(records) {
  const byDate = new Map();
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, { present: 0, total: 0 });
    const entry = byDate.get(r.date);
    entry.total += 1;
    if (r.status === 'present' || r.status === 'late') entry.present += 1;
  }
  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([date, { present, total }]) => ({
      x: date.slice(5),
      y: total ? Math.round((present / total) * 100) : 0,
    }));
}

function computePlayersByTeam(players) {
  const byTeam = new Map();
  for (const p of players) {
    const team = p.team || 'Unassigned';
    byTeam.set(team, (byTeam.get(team) || 0) + 1);
  }
  return Array.from(byTeam.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function DashboardPage({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState(null);
  const [playersByTeam, setPlayersByTeam] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(setAnalytics);
    api.get('/admin/statistics').then(setStats);
    api.get('/admin/reports').then((r) => setReports(r.slice(0, 5)));
    api.get('/admin/attendance').then((records) => setAttendanceTrend(computeAttendanceTrend(records)));
    api.get('/admin/players').then((players) => setPlayersByTeam(computePlayersByTeam(players)));
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
      value: analytics.average_rating != null ? analytics.average_rating.toFixed(1) : '-',
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <LineTrendChart
          title="Attendance rate trend"
          subtitle="Last 8 recorded sessions, program-wide"
          data={attendanceTrend || []}
          yMax={100}
          yFormat={(v) => `${v}%`}
        />
        <RankedBarChart title="Players by team" subtitle="Current roster" data={playersByTeam || []} />
      </div>

      <div className="card elev-sm" style={{ padding: 20, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="card-title">Recent reports</div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="btn btn-ghost"
            style={{ paddingInline: 0, fontSize: 15.5 }}
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
                <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>{r.report_type} report</div>
                <div style={{ fontSize: 14.5, opacity: 0.55 }}>
                  {new Date(r.generated_date).toLocaleDateString()} · {r.generated_by_name}
                </div>
              </div>
              <span className={r.status === 'approved' ? 'tag tag-success' : 'tag tag-warning'}>{r.status}</span>
            </div>
          ))}
          {reports && reports.length === 0 && <div style={{ opacity: 0.6, fontSize: 15, padding: '8px 0' }}>No reports yet.</div>}
        </div>
      </div>
    </>
  );
}
