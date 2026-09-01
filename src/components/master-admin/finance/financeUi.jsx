import { useEffect, useState } from 'react'
import { DateInput } from '../../shared/DateInput.jsx'
import { card } from '../../../utils/masterAdminTheme.js'

export const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

export const RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'fy', label: 'This Financial Year' },
]

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Cheque',
  'Online Gateway',
  'Other',
]

export function Field({ label, children }) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      {children}
    </label>
  )
}

export function FilterBar({ children, onRefresh, extra }) {
  return (
    <div className={`${card} flex flex-col gap-2 p-2.5`}>
      <div className="flex min-w-0 flex-wrap items-end gap-2">{children}</div>
      {extra}
    </div>
  )
}

export function DateRangeFilters({ preset, from, to, onPreset, onFrom, onTo }) {
  return (
    <>
      <Field label="Range">
        <select value={preset} onChange={(e) => onPreset(e.target.value)} className={`${inputClass} sm:w-44`}>
          {RANGE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </Field>
      <Field label="From">
        <DateInput value={from} onChange={(e) => onFrom(e.target.value)} className={inputClass} />
      </Field>
      <Field label="To">
        <DateInput value={to} onChange={(e) => onTo(e.target.value)} className={inputClass} />
      </Field>
    </>
  )
}

export function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
  )
}

export function Toast({ text }) {
  if (!text) return null
  return (
    <div className="fixed right-4 bottom-4 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm text-white shadow-lg">{text}</div>
  )
}

export function useToast() {
  const [toast, setToast] = useState('')
  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])
  return [toast, setToast]
}

export function ActionBtn({ children, onClick, tone = 'neutral', disabled }) {
  const cls =
    tone === 'danger'
      ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
      : tone === 'success'
        ? 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  )
}
