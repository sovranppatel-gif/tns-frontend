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
  return `${API_URL}/api/batches${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
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
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Batch request failed (${response.status})`)
  }
  return data
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

export async function getBatches(params = {}) {
  const data = await request(toQuery(params))
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getBatchById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createBatch(payload) {
  const data = await request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateBatch(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function deleteBatch(id) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return data.entry
}

export async function syncBatches() {
  const data = await request('/sync', { method: 'POST' })
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    batchesCreated: data.batchesCreated || 0,
    batchesUpdated: data.batchesUpdated || 0,
    attendanceUpserts: data.attendanceUpserts || 0,
    courses: data.courses || 0,
    message: data.message || 'Synced',
  }
}

export async function seedBatchRoster(perBatch = 22) {
  const data = await request('/seed-roster', {
    method: 'POST',
    body: JSON.stringify({ perBatch }),
    // heavy seed — client timeout not set on fetch here; rely on server
  })
  return {
    admissionsCreated: data.admissionsCreated || 0,
    feesSynced: data.feesSynced || 0,
    attendanceUpserts: data.attendanceUpserts || 0,
    batches: data.batches || 0,
    message: data.message || 'Roster seeded',
  }
}

export async function getBatchStudents(id) {
  const data = await request(`/${encodeURIComponent(id)}/students`)
  return {
    batch: data.batch || null,
    assigned: Array.isArray(data.assigned) ? data.assigned : [],
    available: Array.isArray(data.available) ? data.available : [],
    blocked: Array.isArray(data.blocked) ? data.blocked : [],
    capacity: data.capacity ?? data.batch?.capacity ?? 20,
    enrolledCount: data.enrolledCount ?? 0,
    seatsLeft: data.seatsLeft ?? 0,
  }
}

export async function assignBatchStudents(id, admissionIds = []) {
  const data = await request(`/${encodeURIComponent(id)}/students`, {
    method: 'POST',
    body: JSON.stringify({ admissionIds }),
  })
  return {
    batch: data.batch || null,
    assigned: Array.isArray(data.assigned) ? data.assigned : [],
    available: Array.isArray(data.available) ? data.available : [],
    blocked: Array.isArray(data.blocked) ? data.blocked : [],
    capacity: data.capacity ?? data.batch?.capacity ?? 20,
    enrolledCount: data.enrolledCount ?? 0,
    seatsLeft: data.seatsLeft ?? 0,
  }
}

export async function removeBatchStudents(id, admissionIds = []) {
  const data = await request(`/${encodeURIComponent(id)}/students`, {
    method: 'DELETE',
    body: JSON.stringify({ admissionIds }),
  })
  return {
    batch: data.batch || null,
    assigned: Array.isArray(data.assigned) ? data.assigned : [],
    available: Array.isArray(data.available) ? data.available : [],
    blocked: Array.isArray(data.blocked) ? data.blocked : [],
    capacity: data.capacity ?? data.batch?.capacity ?? 20,
    enrolledCount: data.enrolledCount ?? 0,
    seatsLeft: data.seatsLeft ?? 0,
  }
}
