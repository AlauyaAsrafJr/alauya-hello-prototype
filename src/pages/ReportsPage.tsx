import type { Report } from '../types';
import { PlusIcon } from '../icons';

export interface ReportRow extends Report {
  tagClass: string;
  onExportPdf: () => void;
  onExportCsv: () => void;
}

interface ReportsPageProps {
  sportFilter: string;
  onSportFilterChange: (value: string) => void;
  sportOptions: string[];
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  onOpenGenerateReport: () => void;
  filteredReports: ReportRow[];
}

export function ReportsPage({
  sportFilter,
  onSportFilterChange,
  sportOptions,
  dateFilter,
  onDateFilterChange,
  onOpenGenerateReport,
  filteredReports,
}: ReportsPageProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: 200 }} value={sportFilter} onChange={(e) => onSportFilterChange(e.target.value)}>
          <option value="all">All sports</option>
          {sportOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={dateFilter} onChange={(e) => onDateFilterChange(e.target.value)}>
          <option value="all">Any date range</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="term">This term</option>
        </select>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn-primary" onClick={onOpenGenerateReport}>
          <PlusIcon />
          Generate report
        </button>
      </div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Sport</th>
              <th>Range</th>
              <th>Generated</th>
              <th>Status</th>
              <th style={{ width: 150 }}>Export</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ opacity: 0.75 }}>{r.sport}</td>
                <td style={{ opacity: 0.75 }}>{r.range}</td>
                <td style={{ opacity: 0.65 }}>{r.generatedOn}</td>
                <td><span className={r.tagClass}>{r.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-secondary" onClick={r.onExportPdf}>PDF</button>
                    <button type="button" className="btn btn-secondary" onClick={r.onExportCsv}>CSV</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
