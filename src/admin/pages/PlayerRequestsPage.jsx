import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { DialogShell } from '../../components/modals/DialogShell';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { CheckIcon, XIcon } from '../../icons';
import { Select } from '../../components/Select';

function statusTag(status) {
  if (status === 'approved') return 'tag tag-success';
  if (status === 'rejected') return 'tag tag-danger';
  return 'tag tag-warning';
}

export function PlayerRequestsPage({ showToast, onCountChange }) {
  const [requests, setRequests] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    const data = await api.get(`/admin/player-requests?status=${statusFilter}`);
    setRequests(data);
    if (statusFilter === 'pending') onCountChange?.(data.length);
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function approve(req) {
    try {
      await api.post(`/admin/player-requests/${req.request_id}/approve`);
      showToast(`${req.first_name} ${req.last_name} approved and added as a player`);
      setApproveTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to approve this request');
    }
  }

  async function reject(req) {
    try {
      await api.post(`/admin/player-requests/${req.request_id}/reject`, { reason: rejectReason || undefined });
      showToast(`Request for ${req.first_name} ${req.last_name} rejected`);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to reject this request');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select
          style={{ maxWidth: 190 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all', label: 'All requests' },
          ]}
        />
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Player name</th>
                <th>Email</th>
                <th>Team</th>
                <th>Requested by</th>
                <th>Requested</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((r) => (
                <tr key={r.request_id}>
                  <td style={{ fontWeight: 600 }}>
                    {r.first_name} {r.middle_name ? `${r.middle_name}. ` : ''}
                    {r.last_name}
                  </td>
                  <td style={{ opacity: 0.75 }}>{r.email}</td>
                  <td style={{ opacity: 0.75 }}>{r.team || '—'}</td>
                  <td style={{ opacity: 0.75 }}>{r.coach_name || '—'}</td>
                  <td style={{ opacity: 0.65 }}>{r.requested_at ? new Date(r.requested_at).toLocaleString() : '—'}</td>
                  <td>
                    <span className={statusTag(r.status)} style={{ textTransform: 'capitalize' }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          aria-label="Accept"
                          onClick={() => setApproveTarget(r)}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          aria-label="Reject"
                          onClick={() => setRejectTarget(r)}
                        >
                          <XIcon />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 14.5, opacity: 0.6 }}>
                        {r.reviewed_by_name ? `by ${r.reviewed_by_name}` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {requests && requests.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No {statusFilter === 'all' ? '' : statusFilter} player requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approveTarget && (
        <ConfirmDialog
          data={{
            title: 'Approve this player?',
            body: `This creates a real player account for ${approveTarget.first_name} ${approveTarget.last_name} using the username and password ${approveTarget.coach_name || 'the coach'} set, and adds them to the ${approveTarget.team || 'team'} roster.`,
            confirmLabel: 'Approve',
            run: () => approve(approveTarget),
          }}
          onClose={() => setApproveTarget(null)}
          onConfirm={() => approve(approveTarget)}
        />
      )}

      {rejectTarget && (
        <DialogShell
          title={`Reject request — ${rejectTarget.first_name} ${rejectTarget.last_name}`}
          onClose={() => {
            setRejectTarget(null);
            setRejectReason('');
          }}
          actions={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={() => reject(rejectTarget)}>
                Reject request
              </button>
            </>
          }
        >
          <div className="field">
            <label>Reason (optional, shown to the coach)</label>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              placeholder="e.g. Duplicate player, missing information..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </DialogShell>
      )}
    </>
  );
}
