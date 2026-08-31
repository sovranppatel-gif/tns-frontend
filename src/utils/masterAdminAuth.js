const TOKEN_KEY = '__master_admin_token__'
const SESSION_KEY = 'tns_master_admin'

export function getMasterAdminToken() {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  return raw.trim().replace(/^["']|["']$/g, '') || null
}

export function decodeMasterAdminJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

export function isMasterAdminTokenValid() {
  const token = getMasterAdminToken()
  if (!token) return false
  const payload = decodeMasterAdminJwtPayload(token)
  if (!payload || payload.role !== 'master_admin') return false
  if (!payload.exp) return false
  return payload.exp * 1000 > Date.now()
}

export function getMasterAdminSession() {
  if (!isMasterAdminTokenValid()) return null
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

/** Live check against tns-server. Clears local JWT if API is down or token is rejected. */
export async function verifyMasterAdminWithServer() {
  const token = getMasterAdminToken()
  if (!token || !isMasterAdminTokenValid()) {
    clearMasterAdminSession()
    return null
  }

  try {
    const { API_URL } = await import('./api.js')
    const response = await fetch(`${API_URL}/api/master-admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.success || !data.user) {
      clearMasterAdminSession()
      return null
    }
    persistMasterAdminSession({ token, user: data.user })
    return data.user
  } catch {
    clearMasterAdminSession()
    return null
  }
}

export function persistMasterAdminSession({ token, user }) {
  const clean = typeof token === 'string' ? token.trim().replace(/^["']|["']$/g, '') : ''
  if (clean) localStorage.setItem(TOKEN_KEY, clean)
  const session = {
    email: user?.email,
    name: user?.name || 'Master Admin',
    role: 'master-admin',
    loggedIn: true,
    timestamp: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('tns-master-auth-change'))
  return session
}

export function clearMasterAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('tns-master-auth-change'))
}

export { TOKEN_KEY, SESSION_KEY }
