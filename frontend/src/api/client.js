import axios from 'axios'

// In dev: Vite proxies /api/v1 → localhost:8000
// In production: VITE_API_URL=https://your-backend.onrender.com/api/v1
const BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({ baseURL: BASE })

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 → try to refresh, then replay the original request once
let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }
    original._retry = true
    isRefreshing = true
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('no refresh token')
      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
      processQueue(null, data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (err) {
      processQueue(err, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
