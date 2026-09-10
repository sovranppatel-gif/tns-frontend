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
  return `${API_URL}/api/admissions${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

export async function getAdmissionsMeta() {
  const response = await fetch(buildUrl('/meta'), { headers: authHeaders() })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load admission options')
  }
  return {
    courses: Array.isArray(data.courses) ? data.courses : [],
    modes: Array.isArray(data.modes) ? data.modes : [],
    statuses: Array.isArray(data.statuses) ? data.statuses : [],
  }
}

export async function getAdmissions({ page = 1, limit = 25, search = '', status = '', mode = '' } = {}) {
  let response
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20000)
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  if (mode) params.set('mode', mode)
  try {
    response = await fetch(buildUrl(`?${params.toString()}`), {
      headers: authHeaders(),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Admissions request timed out. Please retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  } finally {
    window.clearTimeout(timer)
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load admissions')
  }
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    total: Number(data.total ?? data.stats?.total ?? 0),
    page: Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
    totalPages: Number(data.totalPages ?? 0),
  }
}

export async function getAdmissionById(id) {
  const response = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
    headers: authHeaders(),
  })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load admission')
  }
  return data.entry
}

export async function createAdmission(payload) {
  let response
  try {
    response = await fetch(buildUrl(), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to create admission')
  }
  // duplicateWarning is a non-blocking Phase-11 signal (possible existing
  // admission with the same email/phone) — attached to the entry so the
  // one existing caller can surface it without changing its return shape.
  return data.entry ? { ...data.entry, duplicateWarning: data.duplicateWarning || null } : data.entry
}

export async function updateAdmission(id, payload) {
  const response = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update admission')
  }
  return data.entry
}

export async function deleteAdmission(id, { force = false, reason = '' } = {}) {
  const params = new URLSearchParams()
  if (force) params.set('force', 'true')
  const qs = params.toString()
  const response = await fetch(buildUrl(`/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`), {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    const err = new Error(data.message || 'Unable to delete admission')
    err.code = data.code
    err.linkedStudent = Boolean(data.linkedStudent)
    err.linkedFee = Boolean(data.linkedFee)
    throw err
  }
}

/**
 * Upload education marksheet/document (PDF or image, max 400 KB).
 * Accepts student or master-admin Bearer token.
 */
export async function uploadEducationDocument(file, token) {
  if (!file) throw new Error('No file selected')
  if (file.size > 400 * 1024) {
    throw new Error('Document must be 400 KB or smaller')
  }

  const formData = new FormData()
  formData.append('file', file)

  let response
  try {
    response = await fetch(buildUrl('/upload-education-document'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to upload document')
  }
  return data.data
}

/**
 * Upload payment proof / receipt (PDF or image, max 400 KB). Same auth and
 * validation as uploadEducationDocument — separate storage location so it
 * can be verified/rejected independently (see admissions.routes.js).
 */
export async function uploadPaymentProof(file, token) {
  if (!file) throw new Error('No file selected')
  if (file.size > 400 * 1024) {
    throw new Error('Receipt must be 400 KB or smaller')
  }

  const formData = new FormData()
  formData.append('file', file)

  let response
  try {
    response = await fetch(buildUrl('/upload-payment-proof'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to upload receipt')
  }
  return data.data
}

/**
 * Master-admin document/payment verification (Phase 6 / Phase 8).
 */
export async function verifyAdmissionDocument(admissionId, index, status, reason) {
  const response = await fetch(buildUrl(`/${encodeURIComponent(admissionId)}/documents/${index}/verify`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update document verification')
  }
  return data.entry
}

export async function verifyAdmissionPayment(admissionId, status, reason) {
  const response = await fetch(buildUrl(`/${encodeURIComponent(admissionId)}/payment/verify`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  })
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update payment verification')
  }
  return data.entry
}

/**
 * Public catalog — universities + courses for student online admission.
 */
export async function getAdmissionCatalog() {
  let response
  try {
    response = await fetch(buildUrl('/catalog'), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load universities and courses')
  }
  return {
    universities: Array.isArray(data.universities) ? data.universities : [],
    totalCourses: data.totalCourses || 0,
  }
}

/**
 * Student portal — submit online admission application.
 */
export async function createOnlineAdmission(payload, token) {
  let response
  try {
    response = await fetch(buildUrl('/online'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    const err = new Error(data.message || 'Unable to submit online admission')
    if (data.entry) err.entry = data.entry
    throw err
  }
  return data.entry
}

/**
 * Student portal — load own latest online admission application.
 */
export async function getMyOnlineAdmission(token) {
  let response
  try {
    response = await fetch(buildUrl('/online/mine'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load online admission')
  }
  return data.entry || null
}

export async function getMyAdmissionAccess(token) {
  let response
  try {
    response = await fetch(buildUrl('/online/access'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to check admission access')
  }
  return {
    approved: Boolean(data.approved),
    status: String(data.status || ''),
    course: String(data.course || ''),
  }
}

/**
 * Student portal — approved admissions (enrolled courses).
 */
export async function getMyApprovedCourses(token) {
  let response
  try {
    response = await fetch(buildUrl('/online/approved'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load approved courses')
  }
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    total: data.total || 0,
  }
}
