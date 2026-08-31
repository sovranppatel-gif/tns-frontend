import { useMemo, useState } from 'react'

export function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="bg-gradient-to-r from-brand-red to-navy-800 bg-clip-text text-2xl font-semibold text-transparent">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </article>
  )
}

export function Panel({ title, action, children }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold text-navy-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </article>
  )
}

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  let classes = 'bg-slate-100 text-slate-600'
  if (['paid', 'active', 'completed', 'confirmed', 'converted', 'closed'].includes(key)) classes = 'bg-emerald-100 text-emerald-800'
  else if (['pending', 'due', 'open', 'follow-up', 'new'].includes(key)) classes = 'bg-amber-100 text-amber-800'
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${classes}`}>{status}</span>
}

export function ModulePage({ config }) {
  const { stats = [], columns = [], rows = [] } = config || {}
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(s)))
  }, [rows, q])

  return (
    <section className="space-y-3">
      {stats.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((st) => (
            <StatCard key={st.label} {...st} />
          ))}
        </div>
      ) : null}
      <Panel
        title={config.title}
        action={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search records…"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-navy-700"
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="py-2 pr-3">{c.label}</th>
                ))}
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {columns.map((c) => (
                    <td key={c.key} className="py-2.5 pr-3 font-medium text-navy-900">
                      {c.key === 'status' ? <StatusBadge status={row[c.key]} /> : row[c.key]}
                    </td>
                  ))}
                  <td className="py-2.5">
                    <button type="button" className="text-xs font-bold text-brand-red" onClick={() => setSelected(row)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4" onClick={() => setSelected(null)}>
          <div className="card-surface max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-navy-900">Record detail</h3>
            <pre className="mt-3 overflow-auto text-xs text-slate-600">{JSON.stringify(selected, null, 2)}</pre>
            <button type="button" className="btn-primary mt-4" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
