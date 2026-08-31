export const STAFF_STATUSES = ['Active', 'On Leave', 'Inactive']
export const STAFF_GENDERS = ['Male', 'Female', 'Other']
export const STAFF_EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract', 'Temporary']
export const STAFF_WEEKLY_OFFS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Rotational',
]
export const STAFF_SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Full Day', 'Rotational', 'Custom']
export const STAFF_CATEGORIES = [
  'Administration',
  'Accounts & Finance',
  'Admissions & Counseling',
  'Reception & Front Desk',
  'Operations',
  'IT & Technical Support',
  'Security',
  'Transport',
  'Facilities & Maintenance',
  'Housekeeping',
]

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'

export function staffAddPath() {
  return '/master-admin/staff/add'
}

export function staffProfilePath(id) {
  return `/master-admin/staff/${encodeURIComponent(id)}`
}

export function staffArchivePath() {
  return '/master-admin/staff/archive'
}

export function dutyMinutes(start, end) {
  if (!start || !end || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return mins
}

export function dutyDurationLabel(start, end, breakMinutes = 0) {
  const mins = dutyMinutes(start, end) - (Number(breakMinutes) || 0)
  if (!Number.isFinite(mins) || mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!m) return `${h} hour${h === 1 ? '' : 's'}`
  return `${h}h ${m}m`
}

export function photoSrc(photo, apiUrl = '') {
  const value = String(photo || '').trim()
  if (!value) return ''
  if (/^(data:|https?:|blob:)/i.test(value)) return value
  return `${apiUrl}${value}`
}

export function staffInitials(name) {
  return String(name || 'ST')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function isValidIndianMobile(value) {
  return /^[6-9]\d{9}$/.test(String(value || '').replace(/\D/g, ''))
}

export function isValidEmail(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)
}

export function validateStaffForm(form) {
  if (!String(form.fullName || '').trim()) return 'Full name is required'
  if (!isValidIndianMobile(form.mobile)) return 'Enter a valid 10-digit mobile number'
  if (form.alternateMobile && !isValidIndianMobile(form.alternateMobile)) {
    return 'Enter a valid alternate mobile number'
  }
  if (!isValidEmail(form.email)) return 'Enter a valid email address'
  if (!String(form.designation || '').trim()) return 'Designation is required'
  if (form.monthlySalary !== '' && Number(form.monthlySalary) < 0) return 'Salary cannot be negative'
  if (form.dutyStart && form.dutyEnd && dutyMinutes(form.dutyStart, form.dutyEnd) <= 0) {
    return 'Duty hours must be greater than zero'
  }
  if (form.emergencyPhone && !isValidIndianMobile(form.emergencyPhone)) {
    return 'Enter a valid emergency contact number'
  }
  return ''
}
