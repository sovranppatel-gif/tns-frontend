export function facultyProfilePath(id) {
  return `/master-admin/faculty/${encodeURIComponent(id)}`
}

export function facultyAddPath() {
  return '/master-admin/faculty/new'
}

export function facultyAssignmentsPath() {
  return '/master-admin/faculty/assignments'
}

export const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Guest Faculty', 'Contract']
export const FACULTY_GENDERS = ['Male', 'Female', 'Other']
export const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Leave']

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/15'

export function photoSrc(photo, apiUrl = '') {
  const value = String(photo || '').trim()
  if (!value) return ''
  if (/^(data:|https?:|blob:)/i.test(value)) return value
  return `${apiUrl}${value}`
}

export function facultyInitials(name) {
  return String(name || 'FA')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function emptyFacultyForm() {
  return {
    profilePhoto: '',
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    fatherOrHusbandName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    designation: '',
    department: '',
    qualification: '',
    specialization: '',
    experienceYears: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: 'Full Time',
    loginEnabled: false,
    username: '',
    password: '',
    status: 'Active',
    permissions: [],
  }
}

export function facultyToForm(entry) {
  const personal = entry?.personalDetails || {}
  const employment = entry?.employmentDetails || {}
  const account = entry?.accountDetails || {}
  return {
    ...emptyFacultyForm(),
    profilePhoto: personal.profilePhoto || entry?.profilePhoto || '',
    fullName: personal.fullName || entry?.fullName || '',
    gender: personal.gender || entry?.gender || 'Male',
    dateOfBirth: personal.dateOfBirth || '',
    fatherOrHusbandName: personal.fatherOrHusbandName || '',
    mobile: personal.mobile || entry?.mobile || '',
    alternateMobile: personal.alternateMobile || '',
    email: personal.email || entry?.email || '',
    address: personal.address || '',
    city: personal.city || '',
    state: personal.state || '',
    pincode: personal.pincode || '',
    designation: employment.designation || entry?.designation || '',
    department: employment.department || entry?.department || '',
    qualification: employment.qualification || '',
    specialization: employment.specialization || '',
    experienceYears: employment.experienceYears ?? '',
    joiningDate: employment.joiningDate || entry?.joiningDate || '',
    employmentType: employment.employmentType || 'Full Time',
    loginEnabled: Boolean(account.loginEnabled ?? entry?.loginEnabled),
    username: account.username || entry?.username || '',
    password: '',
    status: entry?.status || 'Active',
    permissions: Array.isArray(entry?.permissions) ? entry.permissions : [],
  }
}

export function formToPayload(form) {
  return {
    personalDetails: {
      fullName: form.fullName,
      profilePhoto: form.profilePhoto,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      fatherOrHusbandName: form.fatherOrHusbandName,
      mobile: form.mobile,
      alternateMobile: form.alternateMobile,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    },
    employmentDetails: {
      designation: form.designation,
      department: form.department,
      qualification: form.qualification,
      specialization: form.specialization,
      experienceYears: Number(form.experienceYears) || 0,
      joiningDate: form.joiningDate || null,
      employmentType: form.employmentType,
    },
    accountDetails: {
      loginEnabled: Boolean(form.loginEnabled),
      username: form.username || form.email,
    },
    password: form.password,
    status: form.status,
    permissions: form.permissions || [],
  }
}
