import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { HealthStatus, LoginHistoryRecord, SystemStatistics } from '../../api/domain';

export function SystemStatisticsPage() {
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [logins, setLogins] = useState<LoginHistoryRecord[] | null>(null);

  useEffect(() => {
    api.get<SystemStatistics>('/admin/statistics').then(setStats);
    api.get<HealthStatus>('/admin/health').then(setHealth);
    api.get<LoginHistoryRecord[]>('/admin/login-history').then(setLogins);
  }, []);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card elev-sm" style={{ padding: 18 }}>
          <div className="card-kicker">System health</div>
          {health ? (
            <>
              <div className="card-title" style={{ marginTop: 6, textTransform: 'capitalize' }}>
                <span className={health.status === 'healthy' ? 'tag tag-success' : 'tag tag-danger'}>{health.status}</span>
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 8 }}>Database: {health.database}</div>
              <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 4 }}>Checked {new Date(health.checked_at).toLocaleString()}</div>
            </>
          ) : (
            <div className="card-body">Checking…</div>
          )}
        </div>

        <div className="card elev-sm" style={{ padding: 18 }}>
          <div className="card-kicker">Accounts</div>
          {stats && (
            <>
              <div className="card-title" style={{ fontSize: 24, marginTop: 6 }}>{stats.total_users}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>total users · {stats.active_users} active</div>
              <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 4 }}>
                {stats.total_players} players · {stats.total_coaches} coaches · {stats.total_admins} admins
              </div>
            </>
          )}
        </div>

        <div className="card elev-sm" style={{ padding: 18 }}>
          <div className="card-kicker">Reports</div>
          {stats && (
            <>
              <div className="card-title" style={{ fontSize: 24, marginTop: 6 }}>{stats.total_reports}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>{stats.pending_reports} pending approval</div>
              <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 4 }}>{stats.archived_records} archived records</div>
            </>
          )}
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 10 }}>Login history</div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Login time</th>
              <th>Logout time</th>
              <th>IP address</th>
            </tr>
          </thead>
          <tbody>
            {logins?.map((l) => (
              <tr key={l.log_id}>
                <td style={{ fontWeight: 600 }}>{l.username}</td>
                <td><span className="tag tag-neutral" style={{ textTransform: 'capitalize' }}>{l.role}</span></td>
                <td style={{ opacity: 0.75 }}>{new Date(l.login_time).toLocaleString()}</td>
                <td style={{ opacity: 0.65 }}>{l.logout_time ? new Date(l.logout_time).toLocaleString() : '—'}</td>
                <td style={{ opacity: 0.65 }}>{l.ip_address || '—'}</td>
              </tr>
            ))}
            {logins && logins.length === 0 && (
              <tr><td colSpan={5} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No login history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
