import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'
import { studentRequest } from './studentClient.js'

async function request(path, options = {}) {
  const token = getMasterAdminToken()
  const response = await fetch(`${API_URL}/api/assignments${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) throw new Error(data.message || 'Assignment request failed')
  return data.data ?? data
}

const query = (params) => {
  const value = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, item]) => { if (item !== '' && item != null) value.set(key, item) })
  const text = value.toString()
  return text ? `?${text}` : ''
}

export const getAssignments = (params) => request(`/${query(params)}`)
export const createAssignment = (payload) => request('/', { method: 'POST', body: JSON.stringify(payload) })
export const publishAssignment = (id) => request(`/${encodeURIComponent(id)}/publish`, { method: 'POST' })
export const getAssignment = (id) => request(`/${encodeURIComponent(id)}`)
export const getAssignmentAnalytics = () => request('/analytics')

export async function getStudentAssignments(token) {
  const data = await studentRequest('/api/assignments/student', { token })
  return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
}

export async function submitStudentAssignment(id, payload, token) {
  const response = await fetch(`${API_URL}/api/assignments/student/${encodeURIComponent(id)}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) throw new Error(data.message || 'Unable to submit assignment')
  return data.data ?? data
}
