import { useEffect, useRef, useState } from 'react';
import { api, ApiError, mediaUrl } from '../../api/client';
import { PasswordRow } from '../../components/PasswordRow';
import { StatCard } from '../../components/StatCard';
import { PlayersIcon, ActivitiesIcon, AttendanceIcon, StarIcon } from '../../icons';

function initialsOf(first, last) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
}

export function ProfilePage({ showToast }) {
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [editing, setEditing] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    const [p, a] = await Promise.all([api.get('/coach/profile'), api.get('/coach/analytics')]);
    setProfile(p);
    setContactNumber(p.contact_number || '');
    setAnalytics(a);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveContact() {
    const updated = await api.patch('/coach/profile', { contact_number: contactNumber });
    setProfile(updated);
    setEditing(false);
    showToast('Profile updated');
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      const updated = await api.upload('/coach/profile/photo', formData);
      setProfile(updated);
      showToast('Profile photo updated');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!profile) return <div className="card-body">Loading profile…</div>;

  const statCards = analytics
    ? [
        { label: 'Team size', value: analytics.total_players, icon: PlayersIcon, variant: 'info' },
        { label: 'Training activities', value: analytics.total_activities, icon: ActivitiesIcon, variant: 'success' },
        { label: 'Team attendance rate', value: `${analytics.attendance_rate}%`, icon: AttendanceIcon, variant: 'warning' },
        {
          label: 'Average rating given',
          value: analytics.average_rating != null ? analytics.average_rating.toFixed(1) : '—',
          icon: StarIcon,
          variant: 'accent',
        },
      ]
    : [];

  return (
    <>
      {statCards.length > 0 && (
        <div className="stat-grid-4" style={{ marginBottom: 28 }}>
          {statCards.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} variant={c.variant} />
          ))}
        </div>
      )}

      <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginBottom: 20 }}>
        <div className="card-kicker">Coach profile</div>

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
                  fontSize: 23.5,
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
              style={{ fontSize: 13.5, marginTop: 4, padding: '4px 0' }}
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['Username', profile.username || '—'],
            ['Email', profile.email],
            ['Team', profile.specialization || '—'],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-divider)',
                fontSize: 15,
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
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--color-divider)',
              fontSize: 15,
            }}
          >
            <span style={{ opacity: 0.6 }}>Contact number</span>
            {editing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" style={{ width: 160 }} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
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
                <button type="button" className="btn btn-ghost" style={{ fontSize: 13.5 }} onClick={() => setEditing(true)}>
                  Edit
                </button>
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--color-divider)',
              fontSize: 15,
            }}
          >
            <span style={{ opacity: 0.6 }}>Account status</span>
            <span style={{ fontWeight: 600 }}>{profile.is_active ? 'Active' : 'Inactive'}</span>
          </div>

          <PasswordRow showToast={showToast} />
        </div>

        <p className="card-body" style={{ marginTop: 14 }}>
          Only your contact number and photo can be updated here. Contact an administrator to update your name, email, or team assignment.
        </p>
      </div>
    </>
  );
}
