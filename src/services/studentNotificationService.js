import { API_URL } from '../utils/api.js'
import { getStudentToken } from '../utils/studentAuth.js'

function buildUrl(path = '') {
  return `${API_URL}/api/students/notifications${path}`
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

export async function getStudentNotifications(token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl(), {
      method: 'GET',
      headers: authHeaders(token),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load notifications')
  }
  return {
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    unreadCount: Number(data.unreadCount) || 0,
  }
}

export async function markAllStudentNotificationsRead(token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl('/mark-all-read'), {
      method: 'PATCH',
      headers: authHeaders(token),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to mark notifications read')
  }
  return true
}

export async function markStudentNotificationRead(id, token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl(`/${encodeURIComponent(id)}/read`), {
      method: 'PATCH',
      headers: authHeaders(token),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.'
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to mark notification read')
  }
  return data.notification
}
