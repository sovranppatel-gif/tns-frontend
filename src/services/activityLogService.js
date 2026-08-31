import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders() {
  const token = getMasterAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchActivityLogs({
  page = 1,
  limit = 50,
  section = '',
  action = '',
  search = '',
} = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (section) params.set('section', section)
  if (action) params.set('action', action)
  if (search) params.set('search', search)

  const response = await fetch(`${API_URL}/api/activity-logs?${params.toString()}`, {
    headers: authHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load activity logs')
  }
  return data.data
}

export async function logoutMasterAdmin() {
  const token = getMasterAdminToken()
  if (!token) return
  try {
    await fetch(`${API_URL}/api/master-admin/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    })
  } catch {
    // still clear local session
  }
}
