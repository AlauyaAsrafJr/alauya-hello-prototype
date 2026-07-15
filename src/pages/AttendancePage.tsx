import type { Session } from '../types';

export interface SessionRow extends Session {
  rateTagClass: string;
}

interface AttendancePageProps {
  sportFilter: string;
  onSportFilterChange: (value: string) => void;
  sportOptions: string[];
  dateAllChecked: boolean;
  dateWeekChecked: boolean;
  onDateAll: () => void;
  onDateWeek: () => void;
  filteredSessions: SessionRow[];
}

export function AttendancePage({
  sportFilter,
  onSportFilterChange,
  sportOptions,
  dateAllChecked,
  dateWeekChecked,
  onDateAll,
  onDateWeek,
  filteredSessions,
}: AttendancePageProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: 200 }} value={sportFilter} onChange={(e) => onSportFilterChange(e.target.value)}>
          <option value="all">All sports</option>
          {sportOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="seg">
          <label className="seg-opt">
            <input type="radio" checked={dateAllChecked} onChange={onDateAll} />
            All dates
          </label>
          <label className="seg-opt">
            <input type="radio" checked={dateWeekChecked} onChange={onDateWeek} />
            This week
          </label>
        </div>
      </div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sport / Team</th>
              <th>Session</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td style={{ fontWeight: 600 }}>{s.sport}</td>
                <td style={{ opacity: 0.75 }}>{s.session}</td>
                <td>{s.present}</td>
                <td>{s.absent}</td>
                <td><span className={s.rateTagClass}>{s.rate}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
