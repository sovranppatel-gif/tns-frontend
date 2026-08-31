import { API_URL } from '../utils/api.js'
import { getStudentToken } from '../utils/studentAuth.js'

function buildUrl(path = '') {
  return `${API_URL}/api/attendance${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function networkError() {
  return new Error(
    'Could not reach the server. Make sure the backend is running on port 3000.',
  )
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

/**
 * Student portal — own attendance summary.
 * @param {{ month?: string }} params month as YYYY-MM
 */
export async function getMyAttendance(params = {}) {
  const token = getStudentToken()
  if (!token) throw new Error('Please log in again to view attendance')

  let response
  try {
    response = await fetch(buildUrl(`/mine${toQuery(params)}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw networkError()
  }

  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load attendance')
  }

  return {
    stats: data.stats || {},
    calendar: data.calendar || {},
    trend: Array.isArray(data.trend) ? data.trend : [],
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    months: Array.isArray(data.months) ? data.months : [],
    rows: Array.isArray(data.rows) ? data.rows : [],
    meta: data.meta || {},
  }
}
