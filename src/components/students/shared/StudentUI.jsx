import { primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

export function StatCard({ label, value, icon: Icon, hint, className = '' }) {
  return (
    <article
      className={`group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#00A896]/10 text-[#008C95] transition group-hover:bg-[#FF5E14]/10 group-hover:text-[#FF5E14]">
            <Icon size={15} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 bg-gradient-to-r from-[#FF5E14] to-[#008C95] bg-clip-text text-2xl font-semibold text-transparent">
        {value}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </article>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <article className={`min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="min-w-0 break-words text-base font-semibold text-slate-900 sm:text-lg">{title}</h2> : <span />}
          {action || null}
        </div>
      )}
      {children}
    </article>
  )
}

export function ProgressBar({ value, label, color = 'orange' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const barClass =
    color === 'teal'
      ? 'bg-gradient-to-r from-[#008C95] to-[#00A896]'
      : color === 'green'
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
        : 'bg-gradient-to-r from-[#FF5E14] via-[#FF7A00] to-[#008C95]'

  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  let classes = 'bg-slate-100 text-slate-600'
  if (['paid', 'success', 'completed', 'present', 'resolved', 'approved', 'issued', 'pass', 'active', 'on track', 'published', 'correct', 'ok', 'ready'].includes(key)) {
    classes = 'bg-[#00A896]/15 text-[#005F6B]'
  } else if (['pending', 'due', 'upcoming', 'open', 'live soon', 'live', 'in progress', 'draft', 're-exam allotted', 'on leave', 'missing'].includes(key)) {
    classes = 'bg-amber-100 text-amber-700'
  } else if (['late', 'absent', 'failed', 'fail', 'overdue', 'rejected', 'dropped', 'suspended', 'shortage'].includes(key)) {
    classes = 'bg-rose-100 text-rose-700'
  } else if (['leave', 'partial', 'scheduled', 'refunded', 'cancelled', 'inactive', 'transferred', 'archived'].includes(key)) {
    classes = 'bg-sky-100 text-sky-700'
  } else if (['high'].includes(key)) {
    classes = 'bg-rose-100 text-rose-700'
  } else if (['medium'].includes(key)) {
    classes = 'bg-amber-100 text-amber-700'
  } else if (['low'].includes(key)) {
    classes = 'bg-emerald-100 text-emerald-700'
  } else if (['current', 'next', 'important'].includes(key)) {
    classes = 'bg-[#FF5E14]/15 text-[#FF5E14]'
  } else if (['college', 'trainer', 'faculty', 'student', 'admin'].includes(key)) {
    classes = 'bg-[#00A896]/15 text-[#005F6B]'
  }

  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${classes}`}>
      {status}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-8 text-center">
      {Icon ? (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#00A896]/10 text-[#008C95]">
          <Icon size={22} />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p> : null}
    </div>
  )
}

export function SkeletonBlock({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`${primaryBtn} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`${secondaryBtn} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#FF5E14]/20"
    />
  )
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
