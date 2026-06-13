// Resolves an API-relative media path (e.g. "/media/videos/x.mp4") into a URL
// the browser can load. In dev, Vite proxies /media to the API, so relative
// paths work as-is. In production the frontend and API are on different
// origins, so relative paths must be prefixed with the API's origin.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : ''

export function mediaUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path}`
}
