import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders(json = true) {
  const token = getMasterAdminToken()
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function financeQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    qs.set(key, String(value))
  })
  const q = qs.toString()
  return q ? `?${q}` : ''
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

export async function financeRequest(path, options = {}) {
  const timeoutMs = Number(options.timeoutMs) || 25000
  const { timeoutMs: _ignored, body, method, headers, formData, ...rest } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: method || (body || formData ? 'POST' : 'GET'),
      ...rest,
      signal: rest.signal || controller.signal,
      headers: formData ? { ...authHeaders(false), ...(headers || {}) } : { ...authHeaders(true), ...(headers || {}) },
      body: formData || (body ? JSON.stringify(body) : undefined),
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Finance request timed out. Check the server connection and retry.')
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

export function listResult(data) {
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    stats: data.stats || {},
  }
}
