import { API_URL } from '../utils/api.js'
import { getStudentToken } from '../utils/studentAuth.js'

function buildUrl(path = '') {
  return `${API_URL}/api/students/fees${path}`
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

export async function getMyFees(token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl(), {
      method: 'GET',
      headers: authHeaders(token),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.',
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load fees')
  }
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    details: Array.isArray(data.details) ? data.details : [],
    stats: data.stats || {},
  }
}

export async function getMyFeeById(id, token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
      method: 'GET',
      headers: authHeaders(token),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.',
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load fee details')
  }
  return data.entry
}

export async function submitMyFeePayment(id, payload, token = getStudentToken()) {
  let response
  try {
    response = await fetch(buildUrl(`/${encodeURIComponent(id)}/payments`), {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running on port 3000.',
    )
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to submit payment')
  }
  return data.entry
}
