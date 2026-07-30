import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ReportRecord, ReportType } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { PlusIcon } from '../../icons';

interface ReportsPageProps {
  showToast: (msg: string) => void;
}

export function ReportsPage({ showToast }: ReportsPageProps) {
  const [reports, setReports] = useState<ReportRecord[] | null>(null);
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [details, setDetails] = useState('');

  async function load() {
    const data = await api.get<ReportRecord[]>('/coach/reports');
    setReports(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    await api.post('/coach/reports', { report_type: reportType, details: details || undefined });
    setOpen(false);
    setDetails('');
    showToast('Report generated');
    load();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          <PlusIcon />
          Generate report
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
              <th>Generated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports?.map((r) => (
              <tr key={r.report_id}>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.report_type}</td>
                <td style={{ opacity: 0.75, maxWidth: 320 }}>{r.details || '—'}</td>
                <td style={{ opacity: 0.65 }}>{new Date(r.generated_date).toLocaleString()}</td>
                <td><span className={r.status === 'approved' ? 'tag tag-success' : 'tag tag-warning'}>{r.status}</span></td>
              </tr>
            ))}
            {reports && reports.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No reports generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <DialogShell
          title="Generate report"
          onClose={() => setOpen(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submit}>Generate</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Report type</label>
              <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
                <option value="attendance">Attendance</option>
                <option value="performance">Performance</option>
                <option value="training">Training</option>
              </select>
            </div>
            <div className="field">
              <label>Details (optional)</label>
              <textarea className="input" style={{ minHeight: 70 }} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
          </div>
        </DialogShell>
      )}
    </>
  );
}
