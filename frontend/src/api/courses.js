import api from './client'

export const listCategories = () => api.get('/courses/categories')
export const createCategory = (data) => api.post('/courses/categories', data)

export const listCourses = (params) => api.get('/courses', { params })
export const getCourse = (id) => api.get(`/courses/${id}`)
export const createCourse = (data) => api.post('/courses', data)
export const updateCourse = (id, data) => api.patch(`/courses/${id}`, data)
export const deleteCourse = (id) => api.delete(`/courses/${id}`)

export const addChapter = (courseId, data) => api.post(`/courses/${courseId}/chapters`, data)

export const addLesson = (courseId, chapterId, data) =>
  api.post(`/courses/${courseId}/chapters/${chapterId}/lessons`, data)

export const getLesson = (courseId, chapterId, lessonId) =>
  api.get(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`)

export const uploadVideo = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload/video', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  })
}
