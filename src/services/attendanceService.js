import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders() {
  const token = getMasterAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function buildUrl(path = '') {
  return `${API_URL}/api/attendance${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function networkError() {
  return new Error('Could not reach the server. Make sure the backend is running on port 3000.')
}

async function request(path = '', options = {}) {
  let response
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {}),
      },
    })
  } catch {
    throw networkError()
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Attendance request failed (${response.status})`)
  }
  return data
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    qs.set(key, String(value))
  })
  const query = qs.toString()
  return query ? `?${query}` : ''
}

export async function getAttendanceOverview(params = {}) {
  const data = await request(`/overview${toQuery(params)}`)
  return {
    stats: data.stats || {},
    meta: data.meta || {},
  }
}

export async function getAttendance(params = {}) {
  const data = await request(toQuery(params))
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
    pagination: data.pagination || {},
  }
}

export async function searchAttendance(params = {}) {
  const data = await request(`/search${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
    pagination: data.pagination || {},
  }
}

export async function getAttendanceReport(params = {}) {
  const data = await request(`/report${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
  }
}

export async function getStudentAttendanceHistory(studentId, params = {}) {
  const data = await request(`/student/${encodeURIComponent(studentId)}${toQuery(params)}`)
  return {
    student: data.student || null,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
  }
}

export async function markBulkAttendance(payload) {
  const data = await request('/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    marked: data.marked || 0,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
    pagination: data.pagination || {},
  }
}

export async function markOneAttendance(payload) {
  const data = await request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    entry: data.entry || null,
    marked: data.marked || 0,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
  }
}

export async function updateAttendance(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function setAttendanceLock(payload, locked = true) {
  const data = await request(locked ? '/lock' : '/unlock', {
    method: 'POST',
    body: JSON.stringify({ ...payload, isLocked: locked }),
  })
  return {
    isLocked: Boolean(data.isLocked),
    lockedBy: data.lockedBy || '',
    lockedAt: data.lockedAt || null,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    meta: data.meta || {},
  }
}
