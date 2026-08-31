export function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {Icon ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-navy-900/10 text-navy-800">
          <Icon size={15} />
        </span>
      ) : null}
      <p className="mt-2 bg-gradient-to-r from-brand-red to-navy-800 bg-clip-text text-2xl font-semibold text-transparent">
        {value}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </article>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold text-navy-900">{title}</h2> : <span />}
          {action || null}
        </div>
      )}
      {children}
    </article>
  )
}

export function ProgressBar({ value, label }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-semibold text-navy-800">{pct}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy-900 via-royal to-brand-red transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  let classes = 'bg-slate-100 text-slate-600'
  if (['paid', 'completed', 'present', 'pass', 'ongoing', 'done'].includes(key)) classes = 'bg-emerald-100 text-emerald-800'
  else if (['pending', 'due', 'upcoming', 'open', 'scheduled', 'available'].includes(key)) classes = 'bg-amber-100 text-amber-800'
  else if (['absent', 'late', 'overdue'].includes(key)) classes = 'bg-rose-100 text-brand-red'
  else if (['leave', 'in progress'].includes(key)) classes = 'bg-sky-100 text-sky-800'
  else if (['high'].includes(key)) classes = 'bg-rose-100 text-brand-red'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${classes}`}>
      {status}
    </span>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
    </div>
  )
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ProgressCircle({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <svg width="78" height="78" viewBox="0 0 78 78">
      <circle cx="39" cy="39" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
      <circle
        cx="39"
        cy="39"
        r={r}
        fill="none"
        stroke="#d4a017"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 39 39)"
      />
      <text x="39" y="43" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
        {pct}%
      </text>
    </svg>
  )
}
