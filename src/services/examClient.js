import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'
import { getStudentToken } from '../utils/studentAuth.js'

function headers(kind = 'admin') {
  const token = kind === 'student' ? getStudentToken() : getMasterAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

export async function examRequest(path, options = {}, kind = 'admin') {
  const timeoutMs = Number(options.timeoutMs) || 20000
  const { timeoutMs: _ignored, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        ...headers(kind),
        ...(fetchOptions.headers || {}),
      },
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`)
  }
  return data
}

export function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    qs.set(key, String(value))
  })
  const q = qs.toString()
  return q ? `?${q}` : ''
}
