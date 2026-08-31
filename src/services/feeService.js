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
  return `${API_URL}/api/fees${path}`
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

export async function getFees() {
  let response
  try {
    response = await fetch(buildUrl(), { headers: authHeaders() })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load fees')
  }
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
  }
}

export async function getFeeById(id) {
  let response
  try {
    response = await fetch(buildUrl(`/${encodeURIComponent(id)}`), {
      headers: authHeaders(),
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load fee details')
  }
  return data.entry
}

export async function recordFeePayment(id, payload) {
  let response
  try {
    response = await fetch(buildUrl(`/${encodeURIComponent(id)}/payments`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to record payment')
  }
  return data.entry
}

export async function updateFeePayment(id, paymentId, payload) {
  let response
  try {
    response = await fetch(
      buildUrl(`/${encodeURIComponent(id)}/payments/${encodeURIComponent(paymentId)}`),
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      },
    )
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3000.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update payment')
  }
  return data.entry
}
