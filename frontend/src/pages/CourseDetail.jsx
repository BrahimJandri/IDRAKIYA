import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, getLesson } from '../api/courses'
import { enroll, getEnrollment, updateProgress } from '../api/enrollments'
import { listReviews, leaveReview } from '../api/payments'
import { useAuth } from '../context/AuthContext'

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [lessonData, setLessonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [reviewSent, setReviewSent] = useState(false)
  const [tab, setTab] = useState('content')

  useEffect(() => {
    getCourse(id).then((r) => setCourse(r.data)).catch(() => navigate('/'))
    listReviews(id).then((r) => setReviews(r.data)).catch(() => {})
    if (user) {
      getEnrollment(id).then((r) => setEnrollment(r.data)).catch(() => {})
    }
    setLoading(false)
  }, [id, user])

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return }
    setEnrolling(true); setError('')
    try {
      const { data } = await enroll(id)
      setEnrollment(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  const openLesson = async (lesson, chapterId) => {
    if (!enrollment && !lesson.is_preview) { setError('Enroll first to access this lesson'); return }
    setActiveLesson({ ...lesson, chapterId })
    try {
      const { data } = await getLesson(id, chapterId, lesson.id)
      setLessonData(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Cannot load lesson')
    }
  }

  const markComplete = async () => {
    if (!enrollment || !activeLesson) return
    try {
      await updateProgress(id, activeLesson.id, { is_completed: true, watch_time_seconds: activeLesson.duration_seconds || 0 })
      const { data } = await getEnrollment(id)
      setEnrollment(data)
    } catch {}
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      const { data } = await leaveReview(id, review)
      setReviews((r) => [data, ...r])
      setReviewSent(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not submit review')
    }
  }

  if (loading || !course) return <div className="spinner-center"><div className="spinner" /></div>

  const isFree = course.is_free || Number(course.price) === 0

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Hero */}
      <div className="card mb-6">
        <div style={{ display: 'flex', gap: '2rem', padding: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="course-meta mb-4">
              <span className="badge badge-primary">{course.level}</span>
              {isFree ? <span className="badge badge-success">Free</span>
                : <span className="badge badge-accent">${Number(course.price).toFixed(2)}</span>}
              {course.category && <span className="badge badge-muted">{course.category.name}</span>}
            </div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '.75rem' }}>{course.title}</h1>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{course.description}</p>
            <div className="flex gap-4 text-sm text-muted mb-6">
              <span>📖 {course.total_lessons} lessons</span>
              {course.duration_hours && <span>⏱ {course.duration_hours}h</span>}
              <span>🌐 {course.language}</span>
            </div>

            {enrollment ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-success">Enrolled</span>
                  <span className="text-sm text-muted">{enrollment.progress_percent}% complete</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${enrollment.progress_percent}%` }} />
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling…' : isFree ? 'Enroll for Free' : `Enroll for $${Number(course.price).toFixed(2)}`}
              </button>
            )}
          </div>

          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title}
              style={{ width: 300, height: 200, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Active lesson player */}
      {activeLesson && lessonData && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{lessonData.title}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => { setActiveLesson(null); setLessonData(null) }}>✕ Close</button>
            </div>
            {lessonData.video_url ? (
              <video controls style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 480 }}>
                <source src={lessonData.video_url} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: '3rem' }}>🎬</div>
                <p className="text-muted mt-2">Video URL not set for this lesson.</p>
              </div>
            )}
            {lessonData.description && <p className="text-muted mt-4">{lessonData.description}</p>}
            {lessonData.resource_url && (
              <a href={lessonData.resource_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-4">
                📎 {lessonData.resource_name || 'Download Resource'}
              </a>
            )}
            {enrollment && (
              <button className="btn btn-primary btn-sm mt-4 ml-4" onClick={markComplete}>
                ✓ Mark as Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['content', 'reviews'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'content' ? 'Course Content' : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div>
          {course.chapters?.length === 0 && <p className="text-muted">No chapters added yet.</p>}
          {course.chapters?.map((chapter) => (
            <div key={chapter.id} className="card mb-4">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <h3 style={{ fontWeight: 700 }}>{chapter.title}</h3>
                  {chapter.is_free_preview && <span className="badge badge-success">Free Preview</span>}
                </div>
                {chapter.lessons?.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${activeLesson?.id === lesson.id ? 'completed' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openLesson(lesson, chapter.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lesson.is_preview || chapter.is_free_preview ? '🔓' : enrollment ? '▶' : '🔒'}</span>
                      <span style={{ fontWeight: 500 }}>{lesson.title}</span>
                      {lesson.is_preview && <span className="badge badge-muted text-sm">Preview</span>}
                    </div>
                    {lesson.duration_seconds && (
                      <span className="text-sm text-muted">{Math.floor(lesson.duration_seconds / 60)}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          {enrollment && !reviewSent && (
            <div className="card mb-4">
              <div className="card-body">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Leave a Review</h3>
                <form onSubmit={submitReview}>
                  <div className="form-group">
                    <label>Rating (1–5)</label>
                    <select className="form-control" style={{ maxWidth: 120 }}
                      value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                      {[5,4,3,2,1].map((n) => <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comment</label>
                    <textarea className="form-control" rows={3} value={review.comment}
                      onChange={(e) => setReview({ ...review, comment: e.target.value })}
                      placeholder="Share your experience…" />
                  </div>
                  <button className="btn btn-primary btn-sm">Submit Review</button>
                </form>
              </div>
            </div>
          )}
          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet.</p>
          ) : reviews.map((r) => (
            <div key={r.id} className="card mb-3">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.round(r.rating))}</span>
                  <span className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p>{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
