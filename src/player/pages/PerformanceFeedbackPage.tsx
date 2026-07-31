import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PerformanceFeedback } from '../../api/domain';
import { StarIcon } from '../../icons';

function Rating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, color: 'var(--color-accent)' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i < value ? 1 : 0.25 }}>
          <StarIcon size={14} />
        </span>
      ))}
    </div>
  );
}

export function PerformanceFeedbackPage() {
  const [records, setRecords] = useState<PerformanceFeedback[] | null>(null);

  useEffect(() => {
    api.get<PerformanceFeedback[]>('/player/performance-feedback').then(setRecords);
  }, []);

  if (!records) return <div className="card-body">Loading performance feedback…</div>;

  if (records.length === 0) {
    return <div className="card elev-sm" style={{ padding: 24, opacity: 0.6 }}>No performance feedback yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {records.map((f) => (
        <div key={f.feedback_id} className="card elev-sm" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.coach_name}</div>
              {f.category && <span className="tag tag-info">{f.category}</span>}
            </div>
            <Rating value={f.rating} />
          </div>
          <p className="card-body" style={{ marginBottom: 6 }}>{f.comments}</p>
          <div style={{ fontSize: 11.5, opacity: 0.55 }}>{f.feedback_date}</div>
        </div>
      ))}
    </div>
  );
}
