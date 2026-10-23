import { useState, useEffect } from 'react'
import Research from './components/Research.jsx'
import Pipeline from './components/Pipeline.jsx'
import Analytics from './components/Analytics.jsx'

const TABS = ['Research', 'Pipeline', 'Analytics']

function loadLS(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}

export default function App() {
  const [tab, setTab] = useState('Research')
  const [pipeline, setPipelineState] = useState(() => loadLS('aff_pipeline', {}))
  const [notes, setNotesState] = useState(() => loadLS('aff_notes', {}))
  const [targets, setTargetsState] = useState(() => loadLS('aff_targets', {}))

  const setPipeline = (v) => { setPipelineState(v); localStorage.setItem('aff_pipeline', JSON.stringify(v)) }
  const setNotes = (v) => { setNotesState(v); localStorage.setItem('aff_notes', JSON.stringify(v)) }
  const setTargets = (v) => { setTargetsState(v); localStorage.setItem('aff_targets', JSON.stringify(v)) }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      {/* NAV */}
      <div style={{ background: '#1a5dc8', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>💰</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Affiliate Agency</div>
          <div style={{ color: '#93c5fd', fontSize: 12 }}>Powered by local Hermes LLM</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {Object.keys(pipeline).length > 0 && (
            <span style={{ fontSize: 12, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '3px 10px', borderRadius: 99 }}>
              {Object.keys(pipeline).length} in pipeline
            </span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e5e7eb', padding: '0 24px', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 14, fontWeight: 700, padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === t ? '#1a5dc8' : '#9ca3af',
            borderBottom: `2px solid ${tab === t ? '#1a5dc8' : 'transparent'}`, marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {tab === 'Research' && <Research pipeline={pipeline} setPipeline={setPipeline} />}
        {tab === 'Pipeline' && <Pipeline pipeline={pipeline} setPipeline={setPipeline} notes={notes} setNotes={setNotes} targets={targets} setTargets={setTargets} />}
        {tab === 'Analytics' && <Analytics pipeline={pipeline} targets={targets} />}
      </div>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
