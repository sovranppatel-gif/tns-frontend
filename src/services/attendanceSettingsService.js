import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders() {
  const token = getMasterAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function buildUrl() {
  return `${API_URL}/api/attendance-settings`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function networkError() {
  return new Error('Could not reach the server. Make sure the backend is running.')
}

async function request(options = {}) {
  let response
  try {
    response = await fetch(buildUrl(), {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    })
  } catch {
    throw networkError()
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Attendance settings request failed (${response.status})`)
  }
  return data
}

/** Institute GPS coordinates + radius + attendance-window config (for mobile check-in). */
export async function getAttendanceSettings() {
  const data = await request({ method: 'GET' })
  return data.entry
}

export async function updateAttendanceSettings(payload) {
  const data = await request({ method: 'PUT', body: JSON.stringify(payload) })
  return data.entry
}
