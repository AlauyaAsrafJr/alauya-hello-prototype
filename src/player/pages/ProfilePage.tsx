import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PlayerProfile, PlayerStatistics } from '../../api/domain';
import { useAuth } from '../../auth/AuthContext';

interface ProfilePageProps {
  showToast: (msg: string) => void;
}

export function ProfilePage({ showToast }: ProfilePageProps) {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [editing, setEditing] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, s] = await Promise.all([
      api.get<PlayerProfile>('/player/profile'),
      api.get<PlayerStatistics>('/player/statistics'),
    ]);
    setProfile(p);
    setContactNumber(p.contact_number || '');
    setStats(s);
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
    ? [
        { label: 'Attendance rate', value: `${stats.attendance_rate}%` },
        { label: 'Sessions attended', value: stats.total_sessions },
        { label: 'Activities joined', value: stats.participation_count },
        { label: 'Average rating', value: stats.average_rating != null ? stats.average_rating.toFixed(1) : '—' },
      ]
    : [];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((c) => (
          <div key={c.label} className="card elev-sm" style={{ padding: 18 }}>
            <div className="card-title" style={{ fontSize: 26 }}>{c.value}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, fontWeight: 600 }}>{c.label}</div>
          </div>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13.5 }}>
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
        </div>

        <p className="card-body" style={{ marginTop: 14 }}>
          Only your contact number and photo can be updated here. Contact your coach or the sports office for
          changes to your name, email, or team assignment.
        </p>
      </div>
    </>
  );
}
