import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders() {
  const token = getMasterAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
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

async function request(path, timeoutMs = 25000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}/api/reports${path}`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Reports request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load reports')
  }
  return data
}

export async function getReportsMeta() {
  const data = await request('/meta')
  return {
    universities: Array.isArray(data.universities) ? data.universities : [],
    courses: Array.isArray(data.courses) ? data.courses : [],
    batches: Array.isArray(data.batches) ? data.batches : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
  }
}

export async function getReport(type = 'overview', params = {}) {
  const data = await request(`/${encodeURIComponent(type)}${toQuery(params)}`)
  return data
}
