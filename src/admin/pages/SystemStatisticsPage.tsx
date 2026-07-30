import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type {
  LoginHistoryRecord,
  SystemStatistics,
  PlayerHealthOverview,
  PlayerHealthRecord,
} from '../../api/domain';
import { StatCard } from '../../components/StatCard';
import { DialogShell } from '../../components/modals/DialogShell';
import { HeartPulseIcon } from '../../icons';

function healthTag(status: string) {
  if (status === 'healthy') return 'tag tag-success';
  if (status === 'recovering') return 'tag tag-warning';
  return 'tag tag-danger';
}

export function SystemStatisticsPage() {
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [logins, setLogins] = useState<LoginHistoryRecord[] | null>(null);
  const [playerHealth, setPlayerHealth] = useState<PlayerHealthOverview | null>(null);
  const [historyFor, setHistoryFor] = useState<{ playerId: number; name: string } | null>(null);
  const [history, setHistory] = useState<PlayerHealthRecord[] | null>(null);

  useEffect(() => {
    api.get<SystemStatistics>('/admin/statistics').then(setStats);
    api.get<LoginHistoryRecord[]>('/admin/login-history').then(setLogins);
    api.get<PlayerHealthOverview>('/admin/players/health-overview').then(setPlayerHealth);
  }, []);

  async function openHistory(playerId: number, name: string) {
    setHistoryFor({ playerId, name });
    setHistory(null);
    const data = await api.get<PlayerHealthRecord[]>(`/admin/players/${playerId}/health`);
    setHistory(data);
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
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

      <div className="card-title" style={{ marginBottom: 10 }}>Player health</div>
      {playerHealth && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
          <StatCard label="Healthy" value={playerHealth.counts.healthy} icon={HeartPulseIcon} variant="success" />
          <StatCard label="Recovering" value={playerHealth.counts.recovering} icon={HeartPulseIcon} variant="warning" />
          <StatCard label="Injured" value={playerHealth.counts.injured} icon={HeartPulseIcon} variant="danger" />
        </div>
      )}

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {playerHealth?.players.map((p) => (
              <tr key={p.player_id}>
                <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                <td style={{ opacity: 0.75 }}>{p.team || '—'}</td>
                <td><span className={healthTag(p.health_status)} style={{ textTransform: 'capitalize' }}>{p.health_status}</span></td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => openHistory(p.player_id, `${p.first_name} ${p.last_name}`)}>
                    History
                  </button>
                </td>
              </tr>
            ))}
            {playerHealth && playerHealth.players.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>Every player is healthy right now.</td></tr>
            )}
          </tbody>
        </table>
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

      {historyFor && (
        <DialogShell
          title={`Health history — ${historyFor.name}`}
          onClose={() => setHistoryFor(null)}
          actions={<button type="button" className="btn btn-secondary" onClick={() => setHistoryFor(null)}>Close</button>}
        >
          {history === null ? (
            <div className="card-body">Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((r) => (
                <div key={r.health_record_id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={healthTag(r.status)} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                    <span style={{ fontSize: 11.5, opacity: 0.55 }}>{r.reported_date}</span>
                  </div>
                  {r.injury_type && <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.injury_type}</div>}
                  {r.notes && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{r.notes}</div>}
                  {r.expected_return_date && (
                    <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 4 }}>Expected return: {r.expected_return_date}</div>
                  )}
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Logged by {r.coach_name || '—'}</div>
                </div>
              ))}
              {history.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5 }}>No health records yet.</div>}
            </div>
          )}
        </DialogShell>
      )}
    </>
  );
}
