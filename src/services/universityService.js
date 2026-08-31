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
  return `${API_URL}/api/universities${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

async function request(path = '', options = {}) {
  let response
  const timeoutMs = Number(options.timeoutMs) || 12000
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
      throw new Error('Universities request timed out. Check MongoDB / server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'University request failed')
  }
  return data
}

export async function getUniversities() {
  const data = await request()
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getUniversityById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createUniversity(payload) {
  const data = await request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateUniversity(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function deleteUniversity(id) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return data.entry
}

export async function activateUniversity(id) {
  const data = await request(`/${encodeURIComponent(id)}/activate`, {
    method: 'PATCH',
  })
  return data.entry
}
