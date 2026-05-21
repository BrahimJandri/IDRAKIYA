import api from './client'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const googleAuth = (data) => api.post('/auth/google', data)
export const logout = (refresh_token) => api.post('/auth/logout', { refresh_token })
export const logoutAll = () => api.post('/auth/logout-all')
export const getMe = () => api.get('/auth/me')
export const updateMe = (data) => api.patch('/auth/me', data)
export const changePassword = (data) => api.post('/auth/me/change-password', data)
export const getSessions = () => api.get('/auth/sessions')
export const revokeSession = (id) => api.delete(`/auth/sessions/${id}`)
