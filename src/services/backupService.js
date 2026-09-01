import { API_URL } from '../utils/api.js'
import { getMasterAdminToken } from '../utils/masterAdminAuth.js'

function authHeaders(json = true) {
  const token = getMasterAdminToken()
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

async function request(path, { method = 'GET', body, timeoutMs = 25000 } = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_URL}/api/backup${path}`, {
      method,
      headers: authHeaders(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Backup request timed out. The dump may still be writing — refresh in a moment.')
    }
    throw new Error('Could not reach the server. Make sure the backend is running on port 3001.')
  } finally {
    window.clearTimeout(timer)
  }

  const data = await parseJson(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Backup request failed')
  }
  return data
}

function filenameFromHeader(header, fallback) {
  if (!header) return fallback
  const star = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (star?.[1]) return decodeURIComponent(star[1])
  const quoted = header.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) return quoted[1]
  const plain = header.match(/filename=([^;]+)/i)
  return plain?.[1]?.trim() || fallback
}

export async function getBackupStatus() {
  const data = await request('/status')
  return {
    database: data.database || '',
    ephemeralStorage: Boolean(data.ephemeralStorage),
    storageHint: data.storageHint || '',
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    collections: Array.isArray(data.collections) ? data.collections : [],
    totals: data.totals || { collections: 0, documents: 0 },
    lastBackup: data.lastBackup || null,
  }
}

export async function listBackups() {
  const data = await request('/')
  return Array.isArray(data.backups) ? data.backups : []
}

export async function createBackup(scope = 'all') {
  const data = await request('/', { method: 'POST', body: { scope }, timeoutMs: 90000 })
  return data.backup
}

export async function deleteBackup(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function restoreBackup(id, { confirm, includeUsers = false } = {}) {
  return request(`/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
    body: { confirm, includeUsers },
    timeoutMs: 90000,
  })
}

export async function downloadBackup(id) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 90000)
  let response
  try {
    response = await fetch(`${API_URL}/api/backup/${encodeURIComponent(id)}/download`, {
      headers: authHeaders(false),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Download timed out. Try again, or check the server disk.')
    }
    throw new Error('Could not reach the server to download this backup.')
  } finally {
    window.clearTimeout(timer)
  }

  if (!response.ok) {
    const data = await parseJson(response)
    throw new Error(data.message || 'Unable to download backup')
  }

  const blob = await response.blob()
  const filename = filenameFromHeader(response.headers.get('Content-Disposition'), `${id}.json`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  return filename
}
