import { useState } from 'react'
import OutreachModal from './OutreachModal.jsx'

const STAGES = ['researching', 'applied', 'active', 'paused']
const STAGE_META = {
  researching: { label: 'Researching', emoji: '🔍', color: '#1a5dc8', bg: '#eff6ff' },
  applied: { label: 'Applied', emoji: '📤', color: '#d97706', bg: '#fffbeb' },
  active: { label: 'Active', emoji: '✅', color: '#059669', bg: '#ecfdf5' },
  paused: { label: 'Paused', emoji: '⏸', color: '#6b7280', bg: '#f9fafb' },
}

export default function Pipeline({ pipeline, setPipeline, notes, setNotes, targets, setTargets }) {
  const [outreachProgram, setOutreachProgram] = useState(null)

  const setStage = (name, stage) => setPipeline({ ...pipeline, [name]: { ...pipeline[name], stage } })
  const remove = (name) => { const p = { ...pipeline }; delete p[name]; setPipeline(p) }
  const setNote = (name, val) => setNotes({ ...notes, [name]: val })
  const setTarget = (name, val) => setTargets({ ...targets, [name]: val })

  if (Object.keys(pipeline).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Pipeline is empty</p>
        <p style={{ fontSize: 14 }}>Go to Research tab and click "+ Add to Pipeline" on any program.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {STAGES.map(stage => {
          const meta = STAGE_META[stage]
          const items = Object.values(pipeline).filter(p => p.stage === stage)
          return (
            <div key={stage}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 12px', background: meta.bg, borderRadius: 8 }}>
                <span>{meta.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{meta.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: meta.color, background: meta.bg, fontWeight: 700 }}>{items.length}</span>
              </div>

              {items.map(p => {
                const isHigh = p.type === 'high'
                const accent = isHigh ? '#7c3aed' : '#059669'
                return (
                  <div key={p.name} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>{p.commission}</div>
                      </div>
                      <button onClick={() => remove(p.name)} title="Remove" style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 5, cursor: 'pointer', fontSize: 12, padding: '2px 6px', flexShrink: 0 }}>✕</button>
                    </div>

                    <select value={p.stage} onChange={e => setStage(p.name, e.target.value)}
                      style={{ width: '100%', fontSize: 12, padding: '5px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, background: '#fff', marginBottom: 8, cursor: 'pointer' }}>
                      {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].emoji} {STAGE_META[s].label}</option>)}
                    </select>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Monthly target (conversions)</div>
                      <input type="number" min="0" value={targets[p.name] || ''} onChange={e => setTarget(p.name, Number(e.target.value))}
                        placeholder="e.g. 5"
                        style={{ width: '100%', fontSize: 12, padding: '5px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6 }} />
                    </div>

                    <textarea value={notes[p.name] || ''} onChange={e => setNote(p.name, e.target.value)}
                      placeholder="Notes…"
                      style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, resize: 'vertical', minHeight: 56, marginBottom: 8 }} />

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <a href={p.joinUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: accent, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                        Join ↗
                      </a>
                      <button onClick={() => setOutreachProgram(p)}
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}>
                        ✉️ Outreach
                      </button>
                    </div>
                  </div>
                )
              })}

              {items.length === 0 && (
                <div style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center', padding: '1rem', border: '2px dashed #e5e7eb', borderRadius: 8 }}>Drop here</div>
              )}
            </div>
          )
        })}
      </div>

      {outreachProgram && <OutreachModal program={outreachProgram} onClose={() => setOutreachProgram(null)} />}
    </>
  )
}
