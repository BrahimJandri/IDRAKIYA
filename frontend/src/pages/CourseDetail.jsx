import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, getLesson } from '../api/courses'
import { enroll, getEnrollment, updateProgress } from '../api/enrollments'
import { listReviews, leaveReview } from '../api/payments'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import VideoPlayer from '../components/VideoPlayer'
import { mediaUrl } from '../utils/media'

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
  const [tab, setTab] = useState('overview')
  const [isCapturing, setIsCapturing] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState({})
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCourse(id).then((r) => {
        setCourse(r.data)
        const init = {}
        r.data.chapters?.forEach((ch) => { init[ch.id] = true })
        setExpandedChapters(init)
      }).catch(() => navigate('/courses')),
      listReviews(id).then((r) => setReviews(r.data)).catch(() => {}),
      user ? getEnrollment(id).then((r) => setEnrollment(r.data)).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false))
  }, [id, user])

  // Anti-capture protections
  useEffect(() => {
    if (!lessonData?.video_url) return

    const originalGDM = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices)
    if (navigator.mediaDevices?.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async () => {
        setIsCapturing(true)
        if (videoRef.current) videoRef.current.pause()
        throw new DOMException('Screen capture is not allowed during video playback.', 'NotAllowedError')
      }
    }

    const handleVisibility = () => {
      if (document.hidden && videoRef.current) videoRef.current.pause()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleKey = (e) => {
      if (
        e.key === 'PrintScreen' || e.code === 'PrintScreen' ||
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

  const toggleChapter = (chId) =>
    setExpandedChapters((prev) => ({ ...prev, [chId]: !prev[chId] }))

  const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR'
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null
  const isFree = course && (course.is_free || Number(course.price) === 0)

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!course) return null

  return (
    <div className="ud-page">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="ud-topbar">
        <div className="ud-topbar-left">
          <button className="ud-back-btn" onClick={() => navigate('/courses')}>
            ← {t('common.courses')}
          </button>
          <span className="ud-topbar-title">{course.title}</span>
        </div>
        {enrollment && (
          <div className="ud-topbar-right">
            <div className="ud-topbar-bar">
              <div className="ud-topbar-fill" style={{ width: `${enrollment.progress_percent}%` }} />
            </div>
            <span className="ud-topbar-pct">{enrollment.progress_percent}% {t('course.complete')}</span>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────── */}
      <div className="ud-body">

        {/* ── Left: main ─────────────────────────── */}
        <div className="ud-main">

          {/* Video area */}
          <div className="ud-player-bg">
            {activeLesson && lessonData ? (
              <div ref={playerRef} className="ud-player-inner">
                <VideoPlayer
                  ref={videoRef}
                  src={mediaUrl(lessonData.video_url)}
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
            ) : (
              <div className="ud-welcome">
                {course.thumbnail_url && (
                  <img src={mediaUrl(course.thumbnail_url)} alt={course.title} className="ud-welcome-thumb" />
                )}
                <div className="ud-welcome-overlay" />
                <div className="ud-welcome-body">
                  <div className="ud-play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h2 className="ud-welcome-title">{course.title}</h2>
                  <p className="ud-welcome-hint">{t('course.selectLesson')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson bar */}
          {activeLesson && lessonData && (
            <div className="ud-lesson-bar">
              <h2 className="ud-lesson-name">{lessonData.title}</h2>
              <div className="ud-lesson-actions">
                {lessonData.resource_url && (
                  <a href={mediaUrl(lessonData.resource_url)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    📎 {lessonData.resource_name || t('course.downloadResource')}
                  </a>
                )}
                {enrollment && (
                  <button className="btn btn-primary btn-sm" onClick={markComplete}>
                    ✓ {t('course.markComplete')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="ud-tabs-bar">
            {['overview', 'reviews'].map((tabKey) => (
              <button
                key={tabKey}
                className={`ud-tab-btn${tab === tabKey ? ' active' : ''}`}
                onClick={() => setTab(tabKey)}
              >
                {tabKey === 'overview'
                  ? t('course.tabOverview')
                  : t('course.tabReviews', { count: reviews.length })}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="ud-tab-body">

            {tab === 'overview' && (
              <div className="ud-overview">
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
                )}
                <div className="ud-overview-badges">
                  <span className="badge badge-dark">{course.level}</span>
                  {isFree
                    ? <span className="badge badge-mint">{t('common.free')}</span>
                    : <span className="badge badge-white">${Number(course.price).toFixed(2)}</span>
                  }
                  {course.category && <span className="badge badge-white">{course.category.name}</span>}
                  {avgRating && <span className="ud-rating">⭐ {avgRating} ({reviews.length})</span>}
                </div>

                <div className="ud-overview-stats">
                  <span>📖 {course.total_lessons} {t('common.lessons')}</span>
                  {course.duration_hours && <span>⏱ {course.duration_hours}h</span>}
                  <span>🌐 {course.language}</span>
                </div>

                {course.description && (
                  <p className="ud-overview-desc">{course.description}</p>
                )}

                {!enrollment ? (
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ marginTop: '1.25rem' }}
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling
                      ? t('course.enrolling')
                      : isFree
                        ? t('course.enrollFree')
                        : t('course.enroll', { price: Number(course.price).toFixed(2) })}
                  </button>
                ) : (
                  <div className="ud-enrolled-row">
                    <span className="badge badge-mint">{t('course.enrolledBadge')}</span>
                    <div className="progress" style={{ flex: 1, maxWidth: 240 }}>
                      <div className="progress-fill" style={{ width: `${enrollment.progress_percent}%` }} />
                    </div>
                    <span style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--text-3)' }}>
                      {enrollment.progress_percent}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === 'reviews' && (
              <div className="ud-reviews">
                {enrollment && !reviewSent && (
                  <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div className="card-body">
                      <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>
                        {t('course.leaveReview')}
                      </h3>
                      <form onSubmit={submitReview}>
                        <div className="form-group">
                          <label>{t('course.rating')}</label>
                          <div style={{ display: 'flex', gap: '.25rem' }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.375rem',
                                  opacity: review.rating >= n ? 1 : 0.25, transition: 'opacity .1s', padding: '.1rem' }}
                                onClick={() => setReview({ ...review, rating: n })}>⭐
                              </button>
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

        {/* ── Right: sidebar ──────────────────────── */}
        <aside className="ud-sidebar">
          <div className="ud-sidebar-hd">{t('course.courseContent')}</div>
          <div className="ud-sidebar-scroll">
            {!course.chapters?.length && (
              <p style={{ padding: '1.25rem', color: 'var(--text-3)', fontSize: '.875rem' }}>
                {t('course.noContentSub')}
              </p>
            )}
            {course.chapters?.map((chapter) => (
              <div key={chapter.id} className="ud-ch">
                <button className="ud-ch-head" onClick={() => toggleChapter(chapter.id)}>
                  <span className="ud-ch-arrow">{expandedChapters[chapter.id] ? '▾' : '▸'}</span>
                  <span className="ud-ch-title">{chapter.title}</span>
                  <span className="ud-ch-count">{chapter.lessons?.length || 0} {t('common.lessons')}</span>
                </button>

                {expandedChapters[chapter.id] && (
                  <div className="ud-ch-lessons">
                    {!chapter.lessons?.length && (
                      <p style={{ padding: '.625rem 1.125rem', color: 'var(--text-3)', fontSize: '.8125rem' }}>
                        {t('course.noLessons')}
                      </p>
                    )}
                    {chapter.lessons?.map((lesson) => {
                      const canView = lesson.is_preview || chapter.is_free_preview || !!enrollment
                      const isPlaying = activeLesson?.id === lesson.id
                      return (
                        <div
                          key={lesson.id}
                          className={`ud-ls${isPlaying ? ' ud-ls-active' : ''}${!canView ? ' ud-ls-locked' : ''}`}
                          onClick={() => openLesson(lesson, chapter.id)}
                        >
                          <span className="ud-ls-icon">
                            {isPlaying ? '▶' : !canView ? '🔒' : '○'}
                          </span>
                          <div className="ud-ls-info">
                            <span className="ud-ls-title">{lesson.title}</span>
                            <div className="ud-ls-meta">
                              {lesson.is_preview && (
                                <span className="ud-preview-tag">{t('course.preview')}</span>
                              )}
                              {lesson.duration_seconds && (
                                <span>{Math.floor(lesson.duration_seconds / 60)}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}