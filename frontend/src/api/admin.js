import api from './client'

export const getStats       = ()           => api.get('/admin/stats')
export const listUsers      = (params)     => api.get('/admin/users', { params })
export const updateUser     = (id, data)   => api.patch(`/admin/users/${id}`, data)
export const deleteUser     = (id)         => api.delete(`/admin/users/${id}`)
export const listAllCourses = (params)     => api.get('/admin/courses', { params })
export const adminUpdateCourse = (id, data) => api.patch(`/admin/courses/${id}`, data)
export const adminDeleteCourse = (id)      => api.delete(`/admin/courses/${id}`)
export const listCategories = ()           => api.get('/admin/categories')
export const createCategory = (data)       => api.post('/admin/categories', data)
export const deleteCategory = (id)         => api.delete(`/admin/categories/${id}`)
export const listAllPayments = (params)    => api.get('/admin/payments', { params })
