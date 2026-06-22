import api from './client'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const googleAuth = (data) => api.post('/auth/google', data)
export const logout = (refresh_token) => api.post('/auth/logout', { refresh_token })
export const logoutAll = () => api.post('/auth/logout-all')
export const getMe = () => api.get('/auth/me')
export const updateMe = (data) => api.patch('/auth/me', data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/auth/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const changePassword = (data) => api.post('/auth/me/change-password', data)
export const getSessions = () => api.get('/auth/sessions')
export const revokeSession = (id) => api.delete(`/auth/sessions/${id}`)

export const setup2FA = () => api.post('/auth/2fa/setup')
export const enable2FA = (code) => api.post('/auth/2fa/enable', { code })
export const disable2FA = (code) => api.post('/auth/2fa/disable', { code })
export const login2FA = (data) => api.post('/auth/2fa/login', data)
export const send2FARecovery = (temp_token) => api.post('/auth/2fa/recovery/send', { temp_token })
export const verify2FARecovery = (data) => api.post('/auth/2fa/recovery/verify', data)

export const listPendingUsers = () => api.get('/auth/admin/pending-users')
export const approveUser = (id) => api.post(`/auth/admin/approve-user/${id}`)
export const rejectUser  = (id) => api.post(`/auth/admin/reject-user/${id}`)
