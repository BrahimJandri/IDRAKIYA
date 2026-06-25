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

  const locale = 'ar-DZ'
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!course) return null

  return (
    <div className="ud-page">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="ud-topbar">
        <div className="ud-topbar-left">
          <button className="ud-back-btn" onClick={() => navigate('/dashboard')}>
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

          {error && (
            <div className="alert alert-error" style={{ margin: '1rem' }}>{error}</div>
          )}
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
                      const isPlaying = activeLesson?.id === lesson.id
                      return (
                        <div
                          key={lesson.id}
                          className={`ud-ls${isPlaying ? ' ud-ls-active' : ''}`}
                          onClick={() => openLesson(lesson, chapter.id)}
                        >
                          <span className="ud-ls-icon">
                            {isPlaying ? '▶' : '○'}
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