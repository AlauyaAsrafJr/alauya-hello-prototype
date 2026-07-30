import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PlayerHealthRecord, PlayerProfile, PlayerStatistics } from '../../api/domain';
import { useAuth } from '../../auth/AuthContext';
import { StatCard } from '../../components/StatCard';
import { PasswordRow } from '../../components/PasswordRow';
import { AttendanceIcon, SessionsIcon, ActivitiesIcon, StarIcon } from '../../icons';

interface ProfilePageProps {
  showToast: (msg: string) => void;
}

function healthTag(status: string) {
  if (status === 'healthy') return 'tag tag-success';
  if (status === 'recovering') return 'tag tag-warning';
  return 'tag tag-danger';
}

export function ProfilePage({ showToast }: ProfilePageProps) {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [healthHistory, setHealthHistory] = useState<PlayerHealthRecord[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, s, h] = await Promise.all([
      api.get<PlayerProfile>('/player/profile'),
      api.get<PlayerStatistics>('/player/statistics'),
      api.get<PlayerHealthRecord[]>('/player/health'),
    ]);
    setProfile(p);
    setContactNumber(p.contact_number || '');
    setStats(s);
    setHealthHistory(h);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveContact() {
    const updated = await api.patch<PlayerProfile>('/player/profile', { contact_number: contactNumber });
    setProfile(updated);
    setEditing(false);
    showToast('Profile updated');
    refreshUser();
  }

  if (loading || !profile) return <div className="card-body">Loading profile…</div>;

  const statCards = stats
    ? ([
        { label: 'Attendance rate', value: `${stats.attendance_rate}%`, icon: AttendanceIcon, variant: 'warning' as const },
        { label: 'Sessions attended', value: stats.total_sessions, icon: SessionsIcon, variant: 'info' as const },
        { label: 'Activities joined', value: stats.participation_count, icon: ActivitiesIcon, variant: 'success' as const },
        { label: 'Average rating', value: stats.average_rating != null ? stats.average_rating.toFixed(1) : '—', icon: StarIcon, variant: 'accent' as const },
      ])
    : [];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} variant={c.variant} />
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 24, maxWidth: 560 }}>
        <div className="card-kicker">Player profile</div>
        <div className="card-title" style={{ marginBottom: 14 }}>
          {profile.first_name} {profile.last_name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            ['Username', profile.username || '—'],
            ['Email', profile.email],
            ['Team', profile.team || '—'],
            ['Date of birth', profile.date_of_birth || '—'],
            ['Membership status', profile.membership_status],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
              <span style={{ opacity: 0.6 }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
            <span style={{ opacity: 0.6 }}>Health status</span>
            <span className={healthTag(profile.health_status)} style={{ textTransform: 'capitalize' }}>{profile.health_status}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
            <span style={{ opacity: 0.6 }}>Contact number</span>
            {editing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" style={{ width: 160 }} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                <button type="button" className="btn btn-primary" onClick={saveContact}>Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{profile.contact_number || '—'}</span>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
              </span>
            )}
          </div>

          <PasswordRow showToast={showToast} />
        </div>

        <p className="card-body" style={{ marginTop: 14 }}>
          Only your contact number and photo can be updated here. Contact your coach or the sports office for
          changes to your name, email, or team assignment.
        </p>
      </div>

      {healthHistory && healthHistory.length > 0 && (
        <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginTop: 20 }}>
          <div className="card-kicker">Health history</div>
          <div className="card-title" style={{ marginBottom: 12 }}>Logged by your coach</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {healthHistory.map((r) => (
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
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
