import { useState } from 'react'
import ProgramCard from './ProgramCard.jsx'
import OutreachModal from './OutreachModal.jsx'

const NICHES = [
  { value: 'all', label: 'All niches' },
  { value: 'software and SaaS', label: 'Software & SaaS' },
  { value: 'finance and investing', label: 'Finance & Investing' },
  { value: 'health and wellness', label: 'Health & Wellness' },
  { value: 'marketing and business tools', label: 'Marketing & Business' },
  { value: 'education and online courses', label: 'Education & Courses' },
  { value: 'AI tools', label: 'AI Tools' },
  { value: 'crypto and web3', label: 'Crypto & Web3' },
]

const TYPES = [
  { value: 'both', label: 'Both standard & high-ticket' },
  { value: 'standard', label: 'Standard only' },
  { value: 'high', label: 'High-ticket only ($500+)' },
]

const SORTS = [
  { value: 'commission', label: 'Highest commission' },
  { value: 'cookie', label: 'Cookie duration' },
  { value: 'epc', label: 'EPC (earnings/click)' },
]

export default function Research({ pipeline, setPipeline }) {
  const [niche, setNiche] = useState('all')
  const [commType, setCommType] = useState('both')
  const [sortBy, setSortBy] = useState('commission')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])
  const [programs, setPrograms] = useState([])
  const [saved, setSaved] = useState([])
  const [outreachProgram, setOutreachProgram] = useState(null)

  const addLog = msg => setLog(l => [...l, msg])

  const runResearch = async () => {
    setStatus('running')
    setLog([])
    setPrograms([])
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, commType, sortBy, keyword }),
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'status') addLog(data.message)
            else if (data.type === 'results') { setPrograms(data.programs || []); setStatus('done') }
            else if (data.type === 'error') { addLog('❌ ' + data.message); setStatus('error') }
          } catch {}
        }
      }
      if (status !== 'done') setStatus('done')
    } catch (err) {
      addLog('❌ ' + err.message)
      setStatus('error')
    }
  }

  const addToPipeline = (p) => {
    setPipeline({ ...pipeline, [p.name]: { name: p.name, commission: p.commission, type: p.type, niche: p.niche, network: p.network, joinUrl: p.joinUrl, stage: 'researching' } })
  }

  const shown = commType === 'high' ? programs.filter(p => p.type === 'high')
    : commType === 'standard' ? programs.filter(p => p.type !== 'high')
    : programs

  const high = shown.filter(p => p.type === 'high')
  const standard = shown.filter(p => p.type !== 'high')

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.05em' }}>🔎 Research Parameters</div>

        <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && runResearch()}
          placeholder='Optional keyword — e.g. "recurring SaaS", "weight loss"'
          style={{ width: '100%', fontSize: 14, padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: 8, outline: 'none', marginBottom: 12 }}
          onFocus={e => e.target.style.borderColor = '#1a5dc8'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[{ label: 'Niche', val: niche, set: setNiche, opts: NICHES }, { label: 'Commission type', val: commType, set: setCommType, opts: TYPES }, { label: 'Sort by', val: sortBy, set: setSortBy, opts: SORTS }].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, background: '#fff', height: 38 }}>
                {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button onClick={runResearch} disabled={status === 'running'} style={{ width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700, background: status === 'running' ? '#93c5fd' : '#1a5dc8', color: '#fff', border: 'none', borderRadius: 8, cursor: status === 'running' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {status === 'running' ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>Hermes is thinking…</> : '🔍 Search for Affiliate Programs'}
        </button>
      </div>

      {log.length > 0 && (
        <div style={{ background: '#0f172a', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontFamily: 'monospace' }}>
          {log.map((l, i) => <div key={i} style={{ fontSize: 13, color: i === log.length - 1 ? '#86efac' : '#94a3b8', marginBottom: 3 }}>{l}</div>)}
        </div>
      )}

      {programs.length > 0 && (
        <>
          {high.length > 0 && <SectionHead label="High-ticket programs" emoji="💎" sub={`${high.length} programs · $500+ per conversion`} color="#7c3aed" />}
          {high.map(p => <ProgramCard key={p.name} p={p} inPipeline={!!pipeline[p.name]} pipelineStage={pipeline[p.name]?.stage} onAddToPipeline={addToPipeline} onToggleSave={() => setSaved(s => s.includes(p.name) ? s.filter(x => x !== p.name) : [...s, p.name])} saved={saved.includes(p.name)} showOutreach={setOutreachProgram} />)}
          {standard.length > 0 && <SectionHead label="Standard programs" emoji="🏷️" sub={`${standard.length} programs`} color="#059669" />}
          {standard.map(p => <ProgramCard key={p.name} p={p} inPipeline={!!pipeline[p.name]} pipelineStage={pipeline[p.name]?.stage} onAddToPipeline={addToPipeline} onToggleSave={() => setSaved(s => s.includes(p.name) ? s.filter(x => x !== p.name) : [...s, p.name])} saved={saved.includes(p.name)} showOutreach={setOutreachProgram} />)}
        </>
      )}

      {status === 'idle' && programs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Ready to research</p>
          <p style={{ fontSize: 14 }}>Set your filters and click Search — Hermes will suggest real affiliate programs from its knowledge base.</p>
        </div>
      )}

      {outreachProgram && <OutreachModal program={outreachProgram} onClose={() => setOutreachProgram(null)} />}
    </>
  )
}

function SectionHead({ label, emoji, sub, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px' }}>
      <span>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color }}>{label}</span>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb', marginLeft: 4 }} />
    </div>
  )
}
