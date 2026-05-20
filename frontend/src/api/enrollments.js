import api from './client'

export const enroll = (courseId) => api.post(`/enrollments/${courseId}`)
export const myEnrollments = () => api.get('/enrollments')
export const getEnrollment = (courseId) => api.get(`/enrollments/${courseId}`)
export const updateProgress = (courseId, lessonId, data) =>
  api.post(`/enrollments/${courseId}/progress/${lessonId}`, data)
