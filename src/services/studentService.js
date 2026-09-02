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
  return `${API_URL}/api/students${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    qs.set(key, String(value))
  })
  const q = qs.toString()
  return q ? `?${q}` : ''
}

async function request(path = '', options = {}) {
  let response
  const timeoutMs = Number(options.timeoutMs) || 20000
  const { timeoutMs: _ignored, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    response = await fetch(buildUrl(path), {
      ...fetchOptions,
      signal: options.signal || controller.signal,
      headers: {
        ...authHeaders(),
        ...(fetchOptions.headers || {}),
      },
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Students request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Student request failed')
  }
  return data
}

export async function getStudents(params = {}) {
  const data = await request(toQuery(params))
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getStudentStats() {
  const data = await request('/stats')
  return data.stats || {}
}

export async function getStudentMeta() {
  const data = await request('/meta')
  return {
    statuses: Array.isArray(data.statuses) ? data.statuses : [],
    genders: Array.isArray(data.genders) ? data.genders : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    documentTypes: Array.isArray(data.documentTypes) ? data.documentTypes : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    eligibleAdmissions: Array.isArray(data.eligibleAdmissions) ? data.eligibleAdmissions : [],
  }
}

export async function getStudentById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createStudent(payload) {
  const data = await request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function createStudentFromAdmission(payload) {
  const data = await request('/from-admission', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateStudent(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateStudentStatus(id, status) {
  const data = await request(`/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return data.entry
}

export async function assignStudentBatch(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}/batch`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function syncStudentsFromAdmissions() {
  const data = await request('/sync-from-admissions', {
    method: 'POST',
    timeoutMs: 60000,
  })
  return {
    created: data.created || 0,
    linked: data.linked || 0,
    skipped: data.skipped || 0,
    failed: data.failed || 0,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    message: data.message || 'Synced',
  }
}

export async function uploadStudentDocument(file) {
  if (!file) throw new Error('No file selected')
  if (file.size > 400 * 1024) {
    throw new Error('Document must be 400 KB or smaller')
  }

  const formData = new FormData()
  formData.append('file', file)
  const token = getMasterAdminToken()

  let response
  try {
    response = await fetch(buildUrl('/upload-document'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to upload document')
  }
  return data.data
}

export async function getProfileChangeRequests(params = {}) {
  const data = await request(`/profile-changes${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function approveProfileChange(id) {
  const data = await request(`/profile-changes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  })
  return data.entry
}

export async function rejectProfileChange(id, adminNote = '') {
  const data = await request(`/profile-changes/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminNote }),
  })
  return data.entry
}
