/** "2026-10-01" -> "01-10-2026". Returns "" for empty/invalid input. */
export function formatDateDMY(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

/** "16:30" -> "4:30 PM". */
export function formatTime12(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  const h = Number(match[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${match[2]} ${suffix}`
}

export function formatDateTime(value) {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return `${formatDateDMY(d)} ${time}`
}

/** Client-side mirror of the server's code suggestion: "MIMT NSP" -> "MIMT_NSP". */
export function suggestReferralCode(collegeName) {
  return String(collegeName || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/['’`.]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
    .replace(/_+$/g, '')
}

export function workshopReferralUrl(code) {
  return `${window.location.origin}/workshop?ref=${encodeURIComponent(code)}`
}
