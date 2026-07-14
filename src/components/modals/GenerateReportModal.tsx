import type { GenReportForm } from '../../types';
import { DialogShell } from './DialogShell';

interface GenerateReportModalProps {
  form: GenReportForm;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onFormatChange: (value: 'PDF' | 'CSV') => void;
  onSubmit: () => void;
}

export function GenerateReportModal({ form, onClose, onNameChange, onFormatChange, onSubmit }: GenerateReportModalProps) {
  return (
    <DialogShell
      title="Generate report"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>Generate</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <label>Report name</label>
          <input className="input" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div className="field">
          <label>Format</label>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" checked={form.format === 'PDF'} onChange={() => onFormatChange('PDF')} />
              PDF
            </label>
            <label className="seg-opt">
              <input type="radio" checked={form.format === 'CSV'} onChange={() => onFormatChange('CSV')} />
              CSV
            </label>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
