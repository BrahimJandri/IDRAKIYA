import api from './client'

export const createCheckout = (course_id) => api.post('/payments/checkout', { course_id })
export const myPayments = () => api.get('/payments/my')
export const listReviews = (courseId) => api.get(`/payments/courses/${courseId}/reviews`)
export const leaveReview = (courseId, data) => api.post(`/payments/courses/${courseId}/reviews`, data)
