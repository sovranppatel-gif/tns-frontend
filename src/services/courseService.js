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
  return `${API_URL}/api/courses${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function isAbortError(err) {
  if (!err) return false
  if (err.name === 'AbortError') return true
  if (err.code === 20) return true // DOMException ABORT_ERR
  const msg = String(err.message || '')
  return /aborted|abort/i.test(msg)
}

function networkErrorMessage(err) {
  if (isAbortError(err)) {
    return 'Courses request timed out. Backend MongoDB connection may be slow — retry in a moment.'
  }
  const detail = err?.message ? ` (${err.message})` : ''
  return `Could not reach the server on port 3000${detail}. Confirm backend is running, then retry.`
}

async function request(path = '', options = {}) {
  let response
  const isWrite = Boolean(options.method && options.method !== 'GET')
  const timeoutMs = Number(options.timeoutMs) || (isWrite ? 45000 : 20000)
  const { timeoutMs: _ignored, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    response = await fetch(buildUrl(path), {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        ...authHeaders(),
        ...(fetchOptions.headers || {}),
      },
    })
  } catch (err) {
    throw new Error(networkErrorMessage(err))
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Course request failed (${response.status})`)
  }
  return data
}

export async function getCourses(params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.type) qs.set('type', params.type)
  if (params.universityId) qs.set('universityId', params.universityId)
  const query = qs.toString()
  const data = await request(query ? `?${query}` : '')
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getCourseById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createCourse(payload) {
  const data = await request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateCourse(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function deleteCourse(id) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return data.entry
}

export async function activateCourse(id) {
  const data = await request(`/${encodeURIComponent(id)}/activate`, {
    method: 'PATCH',
  })
  return data.entry
}
