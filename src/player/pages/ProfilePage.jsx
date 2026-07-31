import { useEffect, useRef, useState } from 'react';
import { api, ApiError, mediaUrl } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { StatCard } from '../../components/StatCard';
import { PasswordRow } from '../../components/PasswordRow';
import { AttendanceIcon, SessionsIcon, ActivitiesIcon, StarIcon } from '../../icons';
import { formatYearLevel } from '../../utils/yearLevel';

function healthTag(status) {
  if (status === 'healthy') return 'tag tag-success';
  if (status === 'recovering') return 'tag tag-warning';
  return 'tag tag-danger';
}

function initialsOf(first, last) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
}

export function ProfilePage({ showToast }) {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [healthHistory, setHealthHistory] = useState(null);
  const [editing, setEditing] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    const [p, s, h] = await Promise.all([api.get('/player/profile'), api.get('/player/statistics'), api.get('/player/health')]);
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
    const updated = await api.patch('/player/profile', { contact_number: contactNumber });
    setProfile(updated);
    setEditing(false);
    showToast('Profile updated');
    refreshUser();
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      const updated = await api.upload('/player/profile/photo', formData);
      setProfile(updated);
      showToast('Profile photo updated');
      refreshUser();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading || !profile) return <div className="card-body">Loading profile…</div>;

  const statCards = stats
    ? [
        { label: 'Attendance rate', value: `${stats.attendance_rate}%`, icon: AttendanceIcon, variant: 'warning' },
        { label: 'Sessions attended', value: stats.total_sessions, icon: SessionsIcon, variant: 'info' },
        { label: 'Activities joined', value: stats.participation_count, icon: ActivitiesIcon, variant: 'success' },
        {
          label: 'Average rating',
          value: stats.average_rating != null ? stats.average_rating.toFixed(1) : '—',
          icon: StarIcon,
          variant: 'accent',
        },
      ]
    : [];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} variant={c.variant} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card elev-sm" style={{ padding: 24, flex: '1 1 480px', maxWidth: 560 }}>
          <div className="card-kicker">Player profile</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
              {profile.profile_photo ? (
                <img
                  src={mediaUrl(profile.profile_photo) || undefined}
                  alt=""
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  className="avatar-chip"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    fontSize: 22,
                    background: 'var(--color-accent-100)',
                    color: 'var(--color-accent-400)',
                  }}
                >
                  {initialsOf(profile.first_name, profile.last_name)}
                </div>
              )}
            </div>
            <div>
              <div className="card-title">
                {profile.first_name} {profile.last_name}
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: 12, marginTop: 4, padding: '4px 0' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading…' : profile.profile_photo ? 'Change photo' : 'Upload photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handlePhotoSelected}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Username', profile.username || '—'],
              ['Email', profile.email],
              ['Team', profile.team || '—'],
              ['Year level', formatYearLevel(profile.year_level)],
              ['Date of birth', profile.date_of_birth || '—'],
              ['Membership status', profile.membership_status],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                  fontSize: 13.5,
                }}
              >
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-divider)',
                fontSize: 13.5,
              }}
            >
              <span style={{ opacity: 0.6 }}>Health status</span>
              <span className={healthTag(profile.health_status)} style={{ textTransform: 'capitalize' }}>
                {profile.health_status}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-divider)',
                fontSize: 13.5,
              }}
            >
              <span style={{ opacity: 0.6 }}>Contact number</span>
              {editing ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    style={{ width: 160 }}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                  <button type="button" className="btn btn-primary" onClick={saveContact}>
                    Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600 }}>{profile.contact_number || '—'}</span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(true)}>
                    Edit
                  </button>
                </span>
              )}
            </div>

            <PasswordRow showToast={showToast} />
          </div>

          <p className="card-body" style={{ marginTop: 14 }}>
            Only your contact number and photo can be updated here. Contact your coach or the sports office for changes to your name, email,
            or team assignment.
          </p>
        </div>

        {healthHistory && healthHistory.length > 0 && (
          <div className="card elev-sm" style={{ padding: 24, flex: '1 1 360px', maxWidth: 420 }}>
            <div className="card-kicker">Health history</div>
            <div className="card-title" style={{ marginBottom: 12 }}>
              Logged by your coach
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {healthHistory.map((r) => (
                <div key={r.health_record_id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={healthTag(r.status)} style={{ textTransform: 'capitalize' }}>
                      {r.status}
                    </span>
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
      </div>
    </>
  );
}
