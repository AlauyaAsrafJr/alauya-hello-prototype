import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CoachProfile } from '../../api/domain';
import { ChangePasswordCard } from '../../components/ChangePasswordCard';

interface ProfilePageProps {
  showToast: (msg: string) => void;
}

export function ProfilePage({ showToast }: ProfilePageProps) {
  const [profile, setProfile] = useState<CoachProfile | null>(null);

  useEffect(() => {
    api.get<CoachProfile>('/coach/profile').then(setProfile);
  }, []);

  if (!profile) return <div className="card-body">Loading profile…</div>;

  return (
    <>
      <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginBottom: 20 }}>
        <div className="card-kicker">Coach profile</div>
        <div className="card-title" style={{ marginBottom: 14 }}>
          {profile.first_name} {profile.last_name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['Username', profile.username || '—'],
            ['Email', profile.email],
            ['Team', profile.specialization || '—'],
            ['Contact number', profile.contact_number || '—'],
            ['Account status', profile.is_active ? 'Active' : 'Inactive'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
              <span style={{ opacity: 0.6 }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <p className="card-body" style={{ marginTop: 14 }}>
          Contact an administrator to update your name, email, or team assignment.
        </p>
      </div>

      <ChangePasswordCard showToast={showToast} />
    </>
  );
}
