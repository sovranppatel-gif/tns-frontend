import { API_URL } from './api.js'

/**
 * Open a document that requires an Authorization header (admission education
 * documents / payment proofs are no longer publicly reachable — see
 * tns-server src/lib/documentUrls.js). A plain <a href> can't attach a
 * Bearer token, so this fetches the file as a blob and opens that instead.
 */
export async function openAuthorizedDocument(url, token) {
  if (!url) return
  const absolute = /^https?:\/\//i.test(url) ? url : `${API_URL}${url.startsWith('/') ? url : `/${url}`}`

  let response
  try {
    response = await fetch(absolute, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    throw new Error('Could not reach the server to open this document.')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Unable to open this document.')
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
}
