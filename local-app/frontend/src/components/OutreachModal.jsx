import { useState } from 'react'

export default function OutreachModal({ program, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useState(() => {
    fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setEmail(data.email || '')
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 600, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>✉️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Outreach Email</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{program.name}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: 7, cursor: 'pointer', padding: '6px 10px', fontSize: 14, color: '#374151' }}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 22 }}>⟳</span>
            <div style={{ marginTop: 8, fontSize: 13 }}>Hermes is writing your outreach email…</div>
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: 12, borderRadius: 8 }}>❌ {error}</div>}

        {!loading && !error && (
          <>
            <textarea
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, minHeight: 260, fontSize: 13, lineHeight: 1.7, padding: 14, border: '1.5px solid #e5e7eb', borderRadius: 8, resize: 'vertical', fontFamily: 'monospace', color: '#1f2937' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}>Close</button>
              <button onClick={copy} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 7, border: 'none', background: copied ? '#059669' : '#1a5dc8', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {copied ? '✓ Copied!' : '📋 Copy Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
