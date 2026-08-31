import { API_URL } from './api.js'

const USERS_KEY = 'tns_student_users'
const SESSION_KEY = 'tns_student_session'
const TOKEN_KEY = 'tns_student_token'

const encode = (value) => btoa(encodeURIComponent(value))

export const DEMO_CREDENTIALS = {
  email: 'student@tns.com',
  password: 'stu123',
}

export const DEMO_STUDENT = {
  id: 'demo-tns-student',
  name: 'Demo Student',
  email: DEMO_CREDENTIALS.email,
  mobile: '9876543210',
  course: 'COPA',
  batch: '2026–27',
  enrollmentId: 'TNS-COPA-2026-001',
  password: encode(DEMO_CREDENTIALS.password),
  createdAt: 0,
  isDemo: true,
}

export function getStudents() {
  let stored = []
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    stored = Array.isArray(parsed) ? parsed : []
  } catch {
    stored = []
  }
  const others = stored.filter(
    (u) => u.email !== DEMO_STUDENT.email && u.id !== DEMO_STUDENT.id
  )
  return [DEMO_STUDENT, ...others]
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function getStudentToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setSession(student) {
  const session = {
    id: student.id,
    name: student.name,
    email: student.email,
    mobile: student.mobile,
    course: student.course || '',
    batch: student.batch || '2026–27',
    enrollmentId: student.enrollmentId || student.rollNo || '',
    isDemo: Boolean(student.isDemo),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('tns-auth-change'))
  return session
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('tns-auth-change'))
}

function applyApiAuth(data) {
  const user = data.user || {}
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token)
  }
  return setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile || '',
    course: user.course || '',
    batch: user.batch || '',
    enrollmentId: user.enrollmentId || user.rollNo || '',
    isDemo: false,
  })
}

async function studentAuthPost(path, body) {
  let response
  try {
    response = await fetch(`${API_URL}/api/students/auth${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    const err = new Error(data.message || 'Request failed')
    err.status = response.status
    err.mustResetPassword = Boolean(data.mustResetPassword)
    throw err
  }
  return data
}

export function registerStudent({ name, email, mobile, course, password }) {
  const emailNorm = email.toLowerCase().trim()
  const mobileNorm = mobile.replace(/\D/g, '').slice(-10)

  if (emailNorm === DEMO_STUDENT.email) {
    throw new Error('This email is reserved for the demo student account.')
  }

  const users = getStudents().filter((u) => !u.isDemo)
  if (users.some((u) => u.email === emailNorm)) {
    throw new Error('An account with this email already exists.')
  }
  if (users.some((u) => u.mobile === mobileNorm)) {
    throw new Error('An account with this mobile number already exists.')
  }

  const student = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: emailNorm,
    mobile: mobileNorm,
    course: course || '',
    batch: '2026–27',
    enrollmentId: '',
    password: encode(password),
    createdAt: Date.now(),
    isDemo: false,
  }

  users.push(student)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return setSession(student)
}

function tryDemoLogin(emailOrMobile, password) {
  const key = emailOrMobile.trim().toLowerCase()
  const mobileKey = emailOrMobile.replace(/\D/g, '').slice(-10)
  const isDemoId =
    key === DEMO_CREDENTIALS.email ||
    mobileKey === DEMO_STUDENT.mobile ||
    key === DEMO_STUDENT.mobile
  if (!isDemoId || password !== DEMO_CREDENTIALS.password) return null
  return setSession(DEMO_STUDENT)
}

export async function loginStudent(emailOrMobile, password) {
  try {
    const data = await studentAuthPost('/login', {
      email: String(emailOrMobile || '').trim(),
      password,
    })
    return applyApiAuth(data)
  } catch (err) {
    const demo = tryDemoLogin(emailOrMobile, password)
    if (demo) return demo
    throw err
  }
}

export async function sendStudentResetOtp(identifier) {
  return studentAuthPost('/forgot-password/send-otp', {
    email: String(identifier || '').trim(),
  })
}

export async function verifyStudentResetOtp(email, otp) {
  return studentAuthPost('/forgot-password/verify-otp', {
    email: String(email || '').trim(),
    otp: String(otp || '').trim(),
  })
}

export async function resetStudentPassword(email, password) {
  const data = await studentAuthPost('/forgot-password/reset', {
    email: String(email || '').trim(),
    password,
  })
  return applyApiAuth(data)
}

export function persistStudentSession({ token, user } = {}) {
  if (token) {
    const clean = String(token).trim().replace(/^["']|["']$/g, '')
    if (clean) localStorage.setItem(TOKEN_KEY, clean)
  }
  if (user) {
    return setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
      course: user.course || '',
      batch: user.batch || '',
      enrollmentId: user.enrollmentId || user.rollNo || '',
      isDemo: false,
    })
  }
  return getSession()
}

export const getStudentSession = getSession
export const clearStudentSession = clearSession

export function isStudentLoggedIn() {
  return Boolean(getSession())
}
