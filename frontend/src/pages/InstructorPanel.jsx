import { useEffect, useState } from 'react'
import {
  listCourses, createCourse, updateCourse, deleteCourse,
  addChapter, addLesson, listCategories,
} from '../api/courses'
import { useAuth } from '../context/AuthContext'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}

const BLANK_COURSE = { title: '', slug: '', description: '', price: '0', is_free: true, level: 'beginner', language: 'Arabic', category_id: '', watermark_enabled: true }
const BLANK_CHAPTER = { title: '', order: 0, is_free_preview: false }
const BLANK_LESSON = { title: '', description: '', video_url: '', duration_seconds: '', order: 0, is_preview: false }

export default function InstructorPanel() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Modals
  const [courseModal, setCourseModal] = useState(null)  // null | 'create' | course object
  const [chapterModal, setChapterModal] = useState(null) // null | { courseId }
  const [lessonModal, setLessonModal] = useState(null)   // null | { courseId, chapterId }

  const [courseForm, setCourseForm] = useState(BLANK_COURSE)
  const [chapterForm, setChapterForm] = useState(BLANK_CHAPTER)
  const [lessonForm, setLessonForm] = useState(BLANK_LESSON)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      listCourses({ page: 1, page_size: 100 }).then((r) => setCourses(r.data)),
      listCategories().then((r) => setCategories(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const flash = (m, isError = false) => {
    isError ? setError(m) : setMsg(m)
    setTimeout(() => { setMsg(''); setError('') }, 4000)
  }

  // ── Course ────────────────────────────────────────────────────────────────

  const openCreateCourse = () => { setCourseForm(BLANK_COURSE); setCourseModal('create') }
  const openEditCourse = (c) => { setCourseForm({ ...c, price: String(c.price), category_id: c.category?.id || '' }); setCourseModal(c) }

  const saveCourse = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...courseForm, price: Number(courseForm.price) || 0, category_id: courseForm.category_id || null }
      if (courseModal === 'create') {
        const { data } = await createCourse(payload)
        setCourses((cs) => [data, ...cs])
        flash('Course created!')
      } else {
        const { data } = await updateCourse(courseModal.id, payload)
        setCourses((cs) => cs.map((c) => c.id === data.id ? data : c))
        flash('Course updated!')
      }
      setCourseModal(null)
    } catch (e) { flash(e.response?.data?.detail || 'Failed to save course', true) }
    finally { setSaving(false) }
  }

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return
    try {
      await deleteCourse(id)
      setCourses((cs) => cs.filter((c) => c.id !== id))
      flash('Course deleted')
    } catch (e) { flash(e.response?.data?.detail || 'Delete failed', true) }
  }

  const togglePublish = async (course) => {
    try {
      const { data } = await updateCourse(course.id, { is_published: !course.is_published })
      setCourses((cs) => cs.map((c) => c.id === data.id ? data : c))
      flash(data.is_published ? 'Course published!' : 'Course unpublished')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  // ── Chapter ────────────────────────────────────────────────────────────────

  const saveChapter = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await addChapter(chapterModal.courseId, { ...chapterForm, order: Number(chapterForm.order) })
      flash('Chapter added!')
      setChapterModal(null)
      setChapterForm(BLANK_CHAPTER)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
    finally { setSaving(false) }
  }

  // ── Lesson ─────────────────────────────────────────────────────────────────

  const saveLesson = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...lessonForm, order: Number(lessonForm.order), duration_seconds: Number(lessonForm.duration_seconds) || null }
      await addLesson(lessonModal.courseId, lessonModal.chapterId, payload)
      flash('Lesson added!')
      setLessonModal(null)
      setLessonForm(BLANK_LESSON)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
    finally { setSaving(false) }
  }

  const cf = (k) => (e) => setCourseForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const chf = (k) => (e) => setChapterForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const lf = (k) => (e) => setLessonForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Instructor Panel</h1>
            <p>Manage your courses, chapters, and lessons</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateCourse}>+ New Course</button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {courses.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '4rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <p>You haven't created any courses yet.</p>
          <button className="btn btn-primary mt-4" onClick={openCreateCourse}>Create First Course</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {courses.map((course) => (
            <div key={course.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge ${course.is_published ? 'badge-success' : 'badge-muted'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="badge badge-primary">{course.level}</span>
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '.4rem' }}>{course.title}</h3>
                <p className="text-muted text-sm mb-4" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description || 'No description.'}
                </p>
                <div className="flex gap-2 text-sm text-muted mb-4">
                  <span>📖 {course.total_lessons} lessons</span>
                  <span>{Number(course.price) === 0 ? '🆓 Free' : `💰 $${Number(course.price).toFixed(2)}`}</span>
                  {course.watermark_enabled && <span>🔒 Watermark</span>}
                </div>

                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEditCourse(course)}>Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => togglePublish(course)}>
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => { setChapterModal({ courseId: course.id }); setChapterForm(BLANK_CHAPTER) }}>
                    + Chapter
                  </button>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => {
                      const chId = prompt('Enter Chapter ID to add lesson to:')
                      if (chId) { setLessonModal({ courseId: course.id, chapterId: chId }); setLessonForm(BLANK_LESSON) }
                    }}>
                    + Lesson
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {courseModal && (
        <Modal title={courseModal === 'create' ? 'Create Course' : 'Edit Course'} onClose={() => setCourseModal(null)}>
          <form onSubmit={saveCourse}>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={courseForm.title} onChange={cf('title')} required />
            </div>
            <div className="form-group">
              <label>Slug *</label>
              <input className="form-control" value={courseForm.slug} onChange={cf('slug')} required placeholder="my-course-slug" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={courseForm.description} onChange={cf('description')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Level</label>
                <select className="form-control" value={courseForm.level} onChange={cf('level')}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <input className="form-control" value={courseForm.language} onChange={cf('language')} />
              </div>
              <div className="form-group">
                <label>Price (USD)</label>
                <input className="form-control" type="number" step="0.01" min="0" value={courseForm.price} onChange={cf('price')} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={courseForm.category_id} onChange={cf('category_id')}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={courseForm.is_free} onChange={cf('is_free')} /> Free Course
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={courseForm.watermark_enabled} onChange={cf('watermark_enabled')} /> Enable Watermark
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setCourseModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Chapter Modal */}
      {chapterModal && (
        <Modal title="Add Chapter" onClose={() => setChapterModal(null)}>
          <form onSubmit={saveChapter}>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={chapterForm.title} onChange={chf('title')} required />
            </div>
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={chapterForm.order} onChange={chf('order')} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input type="checkbox" checked={chapterForm.is_free_preview} onChange={chf('is_free_preview')} /> Free Preview Chapter
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setChapterModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Chapter'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lesson Modal */}
      {lessonModal && (
        <Modal title="Add Lesson" onClose={() => setLessonModal(null)}>
          <form onSubmit={saveLesson}>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={lessonForm.title} onChange={lf('title')} required />
            </div>
            <div className="form-group">
              <label>Video URL</label>
              <input className="form-control" value={lessonForm.video_url} onChange={lf('video_url')} placeholder="https://..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Duration (seconds)</label>
                <input className="form-control" type="number" value={lessonForm.duration_seconds} onChange={lf('duration_seconds')} />
              </div>
              <div className="form-group">
                <label>Order</label>
                <input className="form-control" type="number" value={lessonForm.order} onChange={lf('order')} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={2} value={lessonForm.description} onChange={lf('description')} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input type="checkbox" checked={lessonForm.is_preview} onChange={lf('is_preview')} /> Free Preview Lesson
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setLessonModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Lesson'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
