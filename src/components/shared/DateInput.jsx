import { useRef } from 'react'
import { CalendarDays } from 'lucide-react'

export const DATE_PLACEHOLDER = 'dd-mm-yyyy'

export function formatDisplayDate(value, empty = '') {
  if (!value) return empty
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split('-')
    return `${d}-${m}-${y}`
  }
  const dt = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(dt.getTime())) return empty || raw
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${dt.getFullYear()}`
}

export function DateInput({
  value = '',
  onChange,
  min,
  max,
  disabled = false,
  className = '',
  name,
  id,
  required,
  ...rest
}) {
  const inputRef = useRef(null)
  const hasValue = Boolean(value)
  const display = hasValue ? formatDisplayDate(value) : DATE_PLACEHOLDER

  const openPicker = () => {
    if (disabled) return
    const el = inputRef.current
    if (!el) return
    try {
      if (typeof el.showPicker === 'function') el.showPicker()
      else el.focus()
    } catch {
      el.focus()
    }
  }

  return (
    <div className={`relative ${/\bw-auto\b/.test(className) ? 'inline-block' : 'w-full'}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        className={`flex items-center gap-2 text-left ${className}`}
      >
        <span className={`min-w-0 flex-1 tabular-nums ${hasValue ? '' : 'text-slate-400'}`}>
          {display}
        </span>
        <CalendarDays size={15} className="shrink-0 text-[#008C95]" aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="date"
        lang="en-GB"
        name={name}
        id={id}
        required={required}
        value={value || ''}
        min={min || undefined}
        max={max || undefined}
        disabled={disabled}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        {...rest}
      />
    </div>
  )
}
