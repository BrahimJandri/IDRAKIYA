import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, getLesson } from '../api/courses'
import { enroll, getEnrollment, updateProgress } from '../api/enrollments'
import { listReviews, leaveReview } from '../api/payments'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

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
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourse(id).then((r) => setCourse(r.data)).catch(() => navigate('/courses')),
      listReviews(id).then((r) => setReviews(r.data)).catch(() => {}),
      user ? getEnrollment(id).then((r) => setEnrollment(r.data)).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false))
  }, [id, user])

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return }
    setEnrolling(true); setError('')
    try {
      const { data } = await enroll(id)
      setEnrollment(data)
    } catch (e) { setError(e.response?.data?.detail || t('course.enrollmentFailed')) }
    finally { setEnrolling(false) }
  }

  const openLesson = async (lesson, chapterId) => {
    if (!enrollment && !lesson.is_preview) { setError(t('course.enrollToAccess')); return }
    setError(''); setActiveLesson({ ...lesson, chapterId })
    try {
      const { data } = await getLesson(id, chapterId, lesson.id)
      setLessonData(data)
    } catch (e) { setError(e.response?.data?.detail || t('course.cannotLoadLesson')) }
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
    } catch (e) { setError(e.response?.data?.detail || t('course.reviewFailed')) }
  }

  // Anti-capture: activate when a lesson video is open
  useEffect(() => {
    if (!lessonData?.video_url) return

    // 1. Block screen-share attempts via getDisplayMedia
    const originalGDM = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices)
    if (navigator.mediaDevices?.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async () => {
        setIsCapturing(true)
        if (videoRef.current) videoRef.current.pause()
        throw new DOMException('Screen capture is not allowed during video playback.', 'NotAllowedError')
      }
    }

    // 2. Pause video when tab loses visibility
    const handleVisibility = () => {
      if (document.hidden && videoRef.current) videoRef.current.pause()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // 3. Block screenshot keyboard shortcuts
    const handleKey = (e) => {
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.key === 'p')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handleKey, true)

    return () => {
      if (originalGDM) navigator.mediaDevices.getDisplayMedia = originalGDM
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('keydown', handleKey, true)
      setIsCapturing(false)
    }
  }, [lessonData])

  const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR'

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!course) return null

  const isFree = course.is_free || Number(course.price) === 0
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero band */}
      <div className="page-hero">
        <div className="container page-hero-content">
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap', marginBottom: '.875rem' }}>
                <span className="badge badge-dark">{course.level}</span>
                {isFree ? <span className="badge badge-mint">{t('common.free')}</span>
                  : <span className="badge badge-white">${Number(course.price).toFixed(2)}</span>}
                {course.category && <span className="badge badge-white">{course.category.name}</span>}
              </div>

              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: '.75rem' }}>
                {course.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.9375rem', marginBottom: '1.25rem', maxWidth: 540 }}>
                {course.description}
              </p>

              <div style={{ display: 'flex', gap: '1.25rem', color: 'rgba(255,255,255,.45)', fontSize: '.8125rem', fontWeight: 500, marginBottom: '1.75rem' }}>
                <span>📖 {course.total_lessons} {t('common.lessons')}</span>
                {course.duration_hours && <span>⏱ {course.duration_hours}h</span>}
                <span>🌐 {course.language}</span>
                {avgRating && <span>⭐ {avgRating} ({reviews.length})</span>}
              </div>

              {enrollment ? (
                <div style={{ maxWidth: 320 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <span className="badge badge-mint">{t('course.enrolledBadge')}</span>
                    <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.875rem', fontWeight: 600 }}>
                      {enrollment.progress_percent}%
                    </span>
                  </div>
                  <div className="progress" style={{ background: 'rgba(255,255,255,.12)' }}>
                    <div className="progress-fill" style={{ width: `${enrollment.progress_percent}%` }} />
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? t('course.enrolling') : isFree ? t('course.enrollFree') : t('course.enroll', { price: Number(course.price).toFixed(2) })}
                </button>
              )}
            </div>

            {course.thumbnail_url && (
              <img src={course.thumbnail_url} alt={course.title}
                style={{ width: 300, height: 195, objectFit: 'cover', borderRadius: 'var(--r-lg)', flexShrink: 0, border: '1px solid var(--green-600)' }} />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container page-body" style={{ paddingTop: '1.75rem' }}>
        {/* Lesson player */}
        {activeLesson && lessonData && (
          <div className="player-card">
            <div className="player-header">
              <span className="player-title">{lessonData.title}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setActiveLesson(null); setLessonData(null) }}>
                {t('course.closePlayer')}
              </button>
            </div>
            <div className="player-body">
              {lessonData.video_url
                ? (
                  <div ref={playerRef} style={{ position: 'relative' }}>
                    <video
                      ref={videoRef}
                      controls
                      className="player-video"
                      src={lessonData.video_url}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <div className="video-watermark" aria-hidden="true">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="video-watermark-text">
                          {user?.full_name || user?.email || 'IDRAKIYA'}
                        </span>
                      ))}
                    </div>
                    {isCapturing && (
                      <div className="video-capture-overlay">
                        <span style={{ fontSize: '2.5rem' }}>🚫</span>
                        <span>{t('course.captureBlocked')}</span>
                      </div>
                    )}
                  </div>
                )
                : <div className="player-blank">
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                    <span>{t('course.noVideo')}</span>
                  </div>
              }
              {lessonData.description && (
                <p style={{ marginTop: '.875rem', fontSize: '.875rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  {lessonData.description}
                </p>
              )}
              <div className="player-actions">
                {lessonData.resource_url && (
                  <a href={lessonData.resource_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    📎 {lessonData.resource_name || t('course.downloadResource')}
                  </a>
                )}
                {enrollment && (
                  <button className="btn btn-primary btn-sm" onClick={markComplete}>
                    {t('course.markComplete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="tabs">
          {['content', 'reviews'].map((tabKey) => (
            <button key={tabKey} className={`tab-btn${tab === tabKey ? ' active' : ''}`} onClick={() => setTab(tabKey)}>
              {tabKey === 'content'
                ? t('course.tabContent', { count: course.chapters?.length || 0 })
                : t('course.tabReviews', { count: reviews.length })}
            </button>
          ))}
        </div>

        {tab === 'content' && (
          <div>
            {!course.chapters?.length && (
              <div className="empty">
                <div className="empty-icon">📂</div>
                <h3>{t('course.noContentTitle')}</h3>
                <p>{t('course.noContentSub')}</p>
              </div>
            )}
            {course.chapters?.map((chapter) => (
              <div key={chapter.id} className="chapter-block">
                <div className="chapter-header">
                  <span className="chapter-title">{chapter.title}</span>
                  {chapter.is_free_preview && <span className="badge badge-mint">{t('course.freePreview')}</span>}
                  <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.75rem', fontWeight: 500 }}>
                    {chapter.lessons?.length || 0} {t('common.lessons')}
                  </span>
                </div>
                <div className="chapter-body">
                  {!chapter.lessons?.length && (
                    <p style={{ padding: '.5rem .25rem', color: 'var(--text-3)', fontSize: '.875rem' }}>{t('course.noLessons')}</p>
                  )}
                  {chapter.lessons?.map((lesson) => {
                    const canView = lesson.is_preview || chapter.is_free_preview || !!enrollment
                    const isPlaying = activeLesson?.id === lesson.id
                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-row${isPlaying ? ' playing' : ''}`}
                        onClick={() => openLesson(lesson, chapter.id)}
                      >
                        <div className="lesson-row-left">
                          <span className="lesson-row-icon">
                            {isPlaying ? '▶' : canView ? '○' : '🔒'}
                          </span>
                          <span className="lesson-row-title">{lesson.title}</span>
                          {lesson.is_preview && <span className="badge badge-neutral">{t('course.preview')}</span>}
                        </div>
                        {lesson.duration_seconds && (
                          <span className="lesson-row-dur">{Math.floor(lesson.duration_seconds / 60)}m</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            {enrollment && !reviewSent && (
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-body">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.125rem', fontSize: '1rem' }}>
                    {t('course.leaveReview')}
                  </h3>
                  <form onSubmit={submitReview}>
                    <div className="form-group">
                      <label>{t('course.rating')}</label>
                      <div style={{ display: 'flex', gap: '.25rem' }}>
                        {[1,2,3,4,5].map((n) => (
                          <button key={n} type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.375rem',
                              opacity: review.rating >= n ? 1 : 0.25, transition: 'opacity .1s', padding: '.1rem' }}
                            onClick={() => setReview({ ...review, rating: n })}>⭐</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{t('course.comment')}</label>
                      <textarea className="input" rows={3} value={review.comment}
                        onChange={(e) => setReview({ ...review, comment: e.target.value })}
                        placeholder={t('course.commentPlaceholder')} />
                    </div>
                    <button className="btn btn-primary">{t('course.submitReview')}</button>
                  </form>
                </div>
              </div>
            )}
            {!reviews.length ? (
              <div className="empty">
                <div className="empty-icon">💬</div>
                <h3>{t('course.noReviewsTitle')}</h3>
                <p>{t('course.noReviewsSub')}</p>
              </div>
            ) : reviews.map((r) => (
              <div key={r.id} className="card" style={{ marginBottom: '.75rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(r.rating))}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-3)', fontWeight: 500 }}>
                      {new Date(r.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
