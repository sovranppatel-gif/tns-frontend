import { useEffect, useRef, useState } from 'react'
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

/** Digits typed so far -> "dd-mm-yyyy", auto-inserting dashes as the user types. */
function maskDateDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('-')
}

/** "dd-mm-yyyy" -> "yyyy-mm-dd", only when it is a real calendar date. Else null. */
function parseDisplayToIso(text) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return null
  const dt = new Date(year, month - 1, day)
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Date field that supports both typing (dd-mm-yyyy, auto-masked) and a native
 * calendar picker (button + hidden <input type="date">). onChange always
 * fires with { target: { value } } where value is an ISO yyyy-mm-dd string —
 * same contract as a plain <input type="date">, so every caller keeps
 * reading e.target.value unchanged.
 */
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
  const pickerRef = useRef(null)
  const [text, setText] = useState(() => formatDisplayDate(value))

  // Stay in sync when value changes from outside (calendar pick, form reset/load).
  useEffect(() => {
    setText(formatDisplayDate(value))
  }, [value])

  const fireChange = (isoValue) => {
    onChange?.({ target: { value: isoValue, name, id } })
  }

  const onTextChange = (e) => {
    const masked = maskDateDigits(e.target.value)
    setText(masked)
    if (!masked) {
      fireChange('')
      return
    }
    const iso = parseDisplayToIso(masked)
    if (iso) fireChange(iso)
  }

  const onTextBlur = () => {
    // Revert incomplete/invalid typing back to the last committed value.
    if (text && !parseDisplayToIso(text)) {
      setText(formatDisplayDate(value))
    }
  }

  const openPicker = () => {
    if (disabled) return
    const el = pickerRef.current
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
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        id={id}
        required={required}
        value={text}
        disabled={disabled}
        placeholder={DATE_PLACEHOLDER}
        onChange={onTextChange}
        onBlur={onTextBlur}
        className={`tabular-nums ${className}`}
        style={{ paddingRight: '2.25rem' }}
        {...rest}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        tabIndex={-1}
        aria-label="Open calendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#008C95] disabled:opacity-40"
      >
        <CalendarDays size={15} aria-hidden />
      </button>
      <input
        ref={pickerRef}
        type="date"
        lang="en-GB"
        value={value || ''}
        min={min || undefined}
        max={max || undefined}
        disabled={disabled}
        onChange={(e) => fireChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-0 w-0 overflow-hidden opacity-0"
      />
    </div>
  )
}
