export default function ProgramCard({ p, inPipeline, pipelineStage, onAddToPipeline, onToggleSave, saved, showOutreach }) {
  const isHigh = p.type === 'high'
  const accent = isHigh ? '#7c3aed' : '#059669'
  const accentBg = isHigh ? '#f3f0ff' : '#ecfdf5'

  const STAGE_COLORS = { researching: '#1a5dc8', applied: '#d97706', active: '#059669', paused: '#6b7280' }
  const stageColor = STAGE_COLORS[pipelineStage] || '#6b7280'

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accentBg}` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {isHigh ? '💎' : '💵'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{p.company} · via {p.network}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, background: accentBg, color: accent }}>
            {isHigh ? '💎 High-ticket' : '✅ Standard'}
          </span>
          {inPipeline && (
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: stageColor, fontWeight: 700, textTransform: 'capitalize' }}>
              ● {pipelineStage}
            </span>
          )}
          {onToggleSave && (
            <button onClick={() => onToggleSave(p.name)} style={{ border: `1.5px solid ${saved ? '#fbbf24' : '#e5e7eb'}`, background: saved ? '#fffbeb' : '#fafafa', borderRadius: 7, cursor: 'pointer', fontSize: 15, padding: '4px 8px', lineHeight: 1 }}>🔖</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Commission', val: p.commission, hi: true },
          { label: 'Cookie', val: p.cookie },
          { label: 'Avg payout', val: p.avgPayout },
          { label: 'EPC', val: p.epc },
        ].map(s => (
          <div key={s.label} style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 7, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.hi ? accent : '#1f2937', lineHeight: 1.3 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {p.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {p.tags.map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', fontWeight: 500 }}>#{t}</span>
          ))}
        </div>
      )}

      <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, marginBottom: 14 }}>{p.description}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={p.joinUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, padding: '8px 16px', borderRadius: 7, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
          ✦ Join program ↗
        </a>
        {p.adsUrl && (
          <a href={p.adsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', color: '#374151', textDecoration: 'none', background: '#fff' }}>
            👁 View ads
          </a>
        )}
        {onAddToPipeline && !inPipeline && (
          <button onClick={() => onAddToPipeline(p)}
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 7, border: '1.5px solid #1a5dc8', color: '#1a5dc8', background: '#eff6ff', cursor: 'pointer', fontWeight: 600 }}>
            + Add to Pipeline
          </button>
        )}
        {showOutreach && (
          <button onClick={() => showOutreach(p)}
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', color: '#374151', background: '#fff', cursor: 'pointer' }}>
            ✉️ Write Outreach
          </button>
        )}
      </div>
    </div>
  )
}
