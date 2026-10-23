export default function Analytics({ pipeline, targets }) {
  const active = Object.values(pipeline).filter(p => p.stage === 'active')

  const parseCommission = (str) => {
    if (!str) return 0
    const match = str.match(/\$?([\d,]+)/)
    if (match) return parseFloat(match[1].replace(',', ''))
    const pct = str.match(/([\d.]+)%/)
    if (pct) return parseFloat(pct[1])
    return 0
  }

  const rows = active.map(p => {
    const t = targets[p.name] || 0
    const commVal = parseCommission(p.commission)
    const isPercent = p.commission?.includes('%')
    const perConv = isPercent ? commVal * 10 : commVal
    const monthly = perConv * t
    return { ...p, target: t, perConv, monthly }
  })

  const total = rows.reduce((s, r) => s + r.monthly, 0)

  if (active.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No active programs yet</p>
        <p style={{ fontSize: 14 }}>Move programs to "Active" in the Pipeline tab to see earnings estimates here.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              {['Program', 'Commission', 'Monthly target', 'Est. monthly revenue'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111' }}>
                  <div>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{r.niche}</div>
                </td>
                <td style={{ padding: '12px 16px', color: r.type === 'high' ? '#7c3aed' : '#059669', fontWeight: 600 }}>{r.commission}</td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>
                  {r.target > 0 ? `${r.target} conv/mo` : <span style={{ color: '#d1d5db' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: r.monthly > 0 ? '#059669' : '#9ca3af' }}>
                  {r.monthly > 0 ? `$${r.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f0fdf4', borderTop: '2px solid #059669' }}>
              <td colSpan={3} style={{ padding: '12px 16px', fontWeight: 700, color: '#374151', fontSize: 14 }}>Total estimated monthly revenue</td>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669', fontSize: 16 }}>
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        ⚠️ Estimates based on your monthly conversion targets — actual results will vary. Set targets in the Pipeline tab.
      </p>
    </div>
  )
}
