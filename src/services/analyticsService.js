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

export async function getAnalyticsOverview(params = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 25000)
  let response
  try {
    response = await fetch(`${API_URL}/api/analytics/overview${toQuery(params)}`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Analytics request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load analytics')
  }
  return data
}
