import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

async function request(path, { method = 'GET', body, auth = false, timeoutMs = 15000, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getMasterAdminToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('The request timed out. Please try again.')
    throw new Error('Could not reach the server. Check your internet connection and try again.')
  } finally {
    window.clearTimeout(timer)
  }

  if (raw && response.ok) return response

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `Request failed (${response.status})`)
    err.status = response.status
    err.errors = data.errors || null
    throw err
  }
  return data
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') qs.set(key, value)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/* Public */

export async function getPublicReferral(code) {
  const data = await request(`/api/workshop-referrals/public/${encodeURIComponent(code)}`)
  return data.referral
}

export async function getActiveColleges() {
  const data = await request('/api/workshop-registrations/colleges')
  return Array.isArray(data.colleges) ? data.colleges : []
}

export async function submitWorkshopRegistration(payload) {
  return request('/api/workshop-registrations', { method: 'POST', body: payload })
}

/* Admin (JWT) */

export async function listReferralLinks() {
  const data = await request('/api/workshop-referrals', { auth: true })
  return data.rows || []
}

export async function suggestReferralCodeFromServer(collegeName, excludeId) {
  const data = await request(
    `/api/workshop-referrals/suggest-code${toQuery({ collegeName, excludeId })}`,
    { auth: true },
  )
  return data.referralCode || ''
}

export async function createReferralLink(payload) {
  const data = await request('/api/workshop-referrals', { method: 'POST', body: payload, auth: true })
  return data.entry
}

export async function updateReferralLink(id, payload) {
  const data = await request(`/api/workshop-referrals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  })
  return data.entry
}

export async function deleteReferralLink(id) {
  return request(`/api/workshop-referrals/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true })
}

export async function listWorkshopRegistrations(params) {
  return request(`/api/workshop-registrations${toQuery(params)}`, { auth: true })
}

export async function updateWorkshopRegistrationStatus(id, status) {
  const data = await request(`/api/workshop-registrations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  })
  return data.entry
}

export async function downloadWorkshopRegistrationsCsv(params) {
  const response = await request(`/api/workshop-registrations/export${toQuery(params)}`, {
    auth: true,
    raw: true,
    timeoutMs: 60000,
  })
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="([^"]+)"/)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = match?.[1] || 'workshop-registrations.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
