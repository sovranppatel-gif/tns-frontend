import { API_URL } from '../utils/api.js'
import { getStudentToken } from '../utils/studentAuth.js'

export function studentMediaUrl(path) {
  const value = String(path || '').trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  const prefix = API_URL || ''
  return `${prefix}${value.startsWith('/') ? value : `/${value}`}`
}

export async function studentRequest(path, options = {}) {
  const token = options.token || getStudentToken()
  if (!token) throw new Error('Please log in again')

  const timeoutMs = Number(options.timeoutMs) || 25000
  const { token: _t, timeoutMs: _timeout, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`)
  }
  return data
}
