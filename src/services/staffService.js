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
  return `${API_URL}/api/staff${path}`
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
      throw new Error('Staff request timed out. Check the server connection and retry.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Staff request failed (${response.status})`)
  }
  return data
}

export async function getStaffList(params = {}) {
  const data = await request(toQuery(params))
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    stats: data.stats || {},
    pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  }
}

export async function getStaffStats() {
  const data = await request('/stats/overview')
  return data.stats || {}
}

export async function getStaffMeta() {
  const data = await request('/meta')
  return {
    designations: Array.isArray(data.designations) ? data.designations : [],
    departments: Array.isArray(data.departments) ? data.departments : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    shifts: Array.isArray(data.shifts) ? data.shifts : [],
    employmentTypes: Array.isArray(data.employmentTypes) ? data.employmentTypes : [],
    weeklyOffs: Array.isArray(data.weeklyOffs) ? data.weeklyOffs : [],
    statuses: Array.isArray(data.statuses) ? data.statuses : [],
  }
}

export async function getStaffById(id) {
  const data = await request(`/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createStaff(payload) {
  const data = await request('', { method: 'POST', body: JSON.stringify(payload) })
  return data.entry
}

export async function updateStaff(id, payload) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.entry
}

export async function updateStaffStatus(id, status) {
  const data = await request(`/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return data.entry
}

export async function archiveStaff(id) {
  const data = await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
  return data.entry
}

export async function restoreStaff(id) {
  const data = await request(`/${encodeURIComponent(id)}/restore`, { method: 'POST' })
  return data.entry
}

export async function deleteStaff(id) {
  return archiveStaff(id)
}

export async function uploadStaffPhoto(file) {
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

function lookupApi(base) {
  return {
    list: async (params = {}) => {
      const data = await request(`/${base}${toQuery(params)}`)
      return Array.isArray(data.rows) ? data.rows : []
    },
    create: async (payload) => {
      const data = await request(`/${base}`, { method: 'POST', body: JSON.stringify(payload) })
      return data.entry
    },
    update: async (id, payload) => {
      const data = await request(`/${base}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return data.entry
    },
    setStatus: async (id, status) => {
      const data = await request(`/${base}/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return data.entry
    },
    archive: async (id) => {
      const data = await request(`/${base}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      return data.entry
    },
    restore: async (id) => {
      const data = await request(`/${base}/${encodeURIComponent(id)}/restore`, { method: 'POST' })
      return data.entry
    },
  }
}

const departmentsApi = lookupApi('departments')
const designationsApi = lookupApi('designations')
const categoriesApi = lookupApi('categories')
const shiftsApi = lookupApi('shifts')

export const getDepartments = departmentsApi.list
export const createDepartment = departmentsApi.create
export const updateDepartment = departmentsApi.update
export const updateDepartmentStatus = departmentsApi.setStatus
export const archiveDepartment = departmentsApi.archive
export const restoreDepartment = departmentsApi.restore

export const getDesignations = designationsApi.list
export const createDesignation = designationsApi.create
export const updateDesignation = designationsApi.update
export const updateDesignationStatus = designationsApi.setStatus
export const archiveDesignation = designationsApi.archive
export const restoreDesignation = designationsApi.restore

export const getStaffCategories = categoriesApi.list
export const createStaffCategory = categoriesApi.create
export const updateStaffCategory = categoriesApi.update
export const updateStaffCategoryStatus = categoriesApi.setStatus
export const archiveStaffCategory = categoriesApi.archive
export const restoreStaffCategory = categoriesApi.restore

export const getShifts = shiftsApi.list
export const createShift = shiftsApi.create
export const updateShift = shiftsApi.update
export const updateShiftStatus = shiftsApi.setStatus
export const archiveShift = shiftsApi.archive
export const restoreShift = shiftsApi.restore
