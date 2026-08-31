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
  return `${API_URL}/api/faculties${path}`
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    qs.set(key, String(value))
  })
  const q = qs.toString()
  return q ? `?${q}` : ''
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

async function request(path = '', options = {}) {
  const timeoutMs = Number(options.timeoutMs) || 20000
  const { timeoutMs: _ignored, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
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
    if (err?.name === 'AbortError') {
      throw new Error('Faculty request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Faculty request failed (${response.status})`)
  }
  return data
}

export async function getFaculties(params = {}) {
  const data = await request(toQuery(params))
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  }
}

export async function getFacultyStats() {
  const data = await request('/stats/overview')
  return data.stats || {}
}

export async function getFacultyMeta() {
  const data = await request('/meta')
  return {
    designations: Array.isArray(data.designations) ? data.designations : [],
    departments: Array.isArray(data.departments) ? data.departments : [],
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  }
}

export async function getFacultyById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createFaculty(payload) {
  const data = await request('', { method: 'POST', body: JSON.stringify(payload) })
  return data.entry
}

export async function updateFaculty(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateFacultyStatus(id, status) {
  const data = await request(`/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return data.entry
}

export async function deleteFaculty(id) {
  const data = await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
  return data.entry
}

export async function uploadFacultyPhoto(file) {
  if (!file) throw new Error('No file selected')
  if (file.size > 400 * 1024) throw new Error('Photo must be 400 KB or smaller')
  const formData = new FormData()
  formData.append('file', file)
  const token = getMasterAdminToken()
  let response
  try {
    response = await fetch(buildUrl('/upload-photo'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch {
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  }
  const data = await parseJson(response)
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to upload photo')
  }
  return data.data
}

export async function getFacultyAssignments(facultyId) {
  const data = await request(`/${encodeURIComponent(facultyId)}/assignments`)
  return { rows: Array.isArray(data.rows) ? data.rows : [], facultyId: data.facultyId }
}

export async function getAllFacultyAssignments(params = {}) {
  const data = await request(`/assignments${toQuery(params)}`)
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  }
}

export async function createFacultyAssignment(facultyId, payload) {
  const data = await request(`/${encodeURIComponent(facultyId)}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateFacultyAssignment(facultyId, assignmentId, payload) {
  const data = await request(
    `/${encodeURIComponent(facultyId)}/assignments/${encodeURIComponent(assignmentId)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  )
  return data.entry
}

export async function updateFacultyAssignmentStatus(facultyId, assignmentId, status) {
  const data = await request(
    `/${encodeURIComponent(facultyId)}/assignments/${encodeURIComponent(assignmentId)}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  )
  return data.entry
}

export async function deleteFacultyAssignment(facultyId, assignmentId) {
  const data = await request(
    `/${encodeURIComponent(facultyId)}/assignments/${encodeURIComponent(assignmentId)}`,
    { method: 'DELETE' },
  )
  return data.entry
}

export async function getFacultyStudents(facultyId) {
  const data = await request(`/${encodeURIComponent(facultyId)}/students`)
  return { rows: Array.isArray(data.rows) ? data.rows : [], total: data.total || 0 }
}

export async function getFacultyExams(facultyId) {
  const data = await request(`/${encodeURIComponent(facultyId)}/exams`)
  return { rows: Array.isArray(data.rows) ? data.rows : [], total: data.total || 0 }
}

export async function getFacultyTimetable(facultyId) {
  const data = await request(`/${encodeURIComponent(facultyId)}/timetable`)
  return { rows: Array.isArray(data.rows) ? data.rows : [], facultyId: data.facultyId }
}

export async function getTimetable(params = {}) {
  const data = await request(`/timetable${toQuery(params)}`)
  return { rows: Array.isArray(data.rows) ? data.rows : [] }
}

export async function createFacultyTimetable(facultyId, payload) {
  const data = await request(`/${encodeURIComponent(facultyId)}/timetable`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateFacultyTimetable(facultyId, entryId, payload) {
  const data = await request(
    `/${encodeURIComponent(facultyId)}/timetable/${encodeURIComponent(entryId)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  )
  return data.entry
}

export async function deleteFacultyTimetable(facultyId, entryId) {
  const data = await request(
    `/${encodeURIComponent(facultyId)}/timetable/${encodeURIComponent(entryId)}`,
    { method: 'DELETE' },
  )
  return data.entry
}

export async function getFacultyAttendance(facultyId, params = {}) {
  const data = await request(`/${encodeURIComponent(facultyId)}/attendance${toQuery(params)}`)
  return {
    today: data.today || null,
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    month: data.month || '',
  }
}

export async function saveFacultyAttendance(facultyId, payload) {
  const data = await request(`/${encodeURIComponent(facultyId)}/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.entry
}
