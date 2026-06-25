import { useEffect, useRef, useState } from 'react'
import { listCourses, getCourse, createCourse, updateCourse, deleteCourse, addChapter, addLesson, listCategories, uploadVideo } from '../api/courses'
import { useTranslation } from 'react-i18next'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>
}

const BLANK_COURSE  = { title:'', slug:'', description:'', price:'0', is_free:true, level:'beginner', language:'Arabic', category_id:'', watermark_enabled:true }
const BLANK_CHAPTER = { title:'', order:0, is_free_preview:false }
const BLANK_LESSON  = { title:'', description:'', video_url:'', duration_seconds:'', order:0, is_preview:false }

export default function InstructorPanel() {
  const { t } = useTranslation()
  const [courses, setCourses]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [msg, setMsg]   = useState('')
  const [err, setErr]   = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // null | 0-100
  const fileInputRef = useRef(null)

  const [courseModal,  setCourseModal]  = useState(null)
  const [chapterModal, setChapterModal] = useState(null)
  const [lessonModal,  setLessonModal]  = useState(null)

  const [expanded, setExpanded]             = useState({}) // courseId -> bool
  const [courseDetails, setCourseDetails]   = useState({}) // courseId -> CourseDetail (with chapters/lessons)
  const [detailsLoading, setDetailsLoading] = useState({}) // courseId -> bool

  const [courseForm,  setCourseForm]  = useState(BLANK_COURSE)
  const [chapterForm, setChapterForm] = useState(BLANK_CHAPTER)
  const [lessonForm,  setLessonForm]  = useState(BLANK_LESSON)

  useEffect(() => {
    Promise.all([
      listCourses({ page:1, page_size:100 }).then((r) => setCourses(r.data)).catch(() => {}),
      listCategories().then((r) => setCategories(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const flash = (m, isErr=false) => {
    isErr ? setErr(m) : setMsg(m)
    setTimeout(() => { setMsg(''); setErr('') }, 4000)
  }

  const cf  = (k) => (e) => setCourseForm((f)  => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }))
  const chf = (k) => (e) => setChapterForm((f) => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }))
  const lf  = (k) => (e) => setLessonForm((f)  => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }))

  const saveCourse = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...courseForm, price: Number(courseForm.price)||0, category_id: courseForm.category_id||null }
      if (courseModal === 'create') {
        const { data } = await createCourse(payload)
        setCourses((cs) => [data, ...cs]); flash(t('instructor.courseCreated'))
      } else {
        const { data } = await updateCourse(courseModal.id, payload)
        setCourses((cs) => cs.map((c) => c.id===data.id ? data : c)); flash(t('instructor.courseUpdated'))
      }
      setCourseModal(null)
    } catch (e) { flash(e.response?.data?.detail || t('instructor.failed'), true) }
    finally { setSaving(false) }
  }

  const togglePublish = async (course) => {
    try {
      const { data } = await updateCourse(course.id, { is_published: !course.is_published })
      setCourses((cs) => cs.map((c) => c.id===data.id ? data : c))
      flash(data.is_published ? t('instructor.coursePublished') : t('instructor.courseUnpublished'))
    } catch (e) { flash(e.response?.data?.detail || t('instructor.failed'), true) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('instructor.deleteConfirm'))) return
    try { await deleteCourse(id); setCourses((cs) => cs.filter((c) => c.id!==id)); flash(t('instructor.deleted')) }
    catch (e) { flash(e.response?.data?.detail || t('instructor.deleteFailed'), true) }
  }

  const refreshCourseDetail = async (courseId) => {
    try {
      const { data } = await getCourse(courseId)
      setCourseDetails((d) => ({ ...d, [courseId]: data }))
    } catch { /* ignore */ }
  }

  const toggleContent = async (courseId) => {
    setExpanded((e) => ({ ...e, [courseId]: !e[courseId] }))
    if (!courseDetails[courseId]) {
      setDetailsLoading((d) => ({ ...d, [courseId]: true }))
      try {
        const { data } = await getCourse(courseId)
        setCourseDetails((d) => ({ ...d, [courseId]: data }))
      } catch (e) { flash(e.response?.data?.detail || t('instructor.failed'), true) }
      finally { setDetailsLoading((d) => ({ ...d, [courseId]: false })) }
    }
  }

  const saveChapter = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const courseId = chapterModal.courseId
      await addChapter(courseId, { ...chapterForm, order: Number(chapterForm.order) })
      flash(t('instructor.chapterAdded')); setChapterModal(null); setChapterForm(BLANK_CHAPTER)
      await refreshCourseDetail(courseId)
    } catch (e) { flash(e.response?.data?.detail || t('instructor.failed'), true) }
    finally { setSaving(false) }
  }

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadProgress(0)
    try {
      const { data } = await uploadVideo(file, setUploadProgress)
      setLessonForm((f) => ({ ...f, video_url: data.url }))
    } catch (err) {
      flash(err.response?.data?.detail || 'Upload failed', true)
    } finally {
      setUploadProgress(null)
    }
  }

  const saveLesson = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { courseId, chapterId } = lessonModal
      const payload = { ...lessonForm, order: Number(lessonForm.order), duration_seconds: Number(lessonForm.duration_seconds)||null }
      await addLesson(courseId, chapterId, payload)
      flash(t('instructor.lessonAdded')); setLessonModal(null); setLessonForm(BLANK_LESSON)
      setCourses((cs) => cs.map((c) => c.id===courseId ? { ...c, total_lessons: c.total_lessons + 1 } : c))
      await refreshCourseDetail(courseId)
    } catch (e) { flash(e.response?.data?.detail || t('instructor.failed'), true) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="container page-hero-content" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p className="page-hero-eyebrow">{t('instructor.eyebrow')}</p>
            <h1>{t('instructor.yourCourses').replace(/<\/?1>/g, '')}</h1>
            <p>{courses.length} {t('instructor.totalCourses_other', { count: courses.length })}</p>
          </div>
          <button className="btn btn-primary btn-lg"
            onClick={() => { setCourseForm(BLANK_COURSE); setCourseModal('create') }}>
            {t('instructor.newCourse')}
          </button>
        </div>
      </div>

      <div className="container page-body" style={{ paddingTop:'1.75rem' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {!courses.length ? (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <h3>{t('instructor.noCoursesTitle')}</h3>
            <p>{t('instructor.noCoursesSub')}</p>
            <button className="btn btn-primary" onClick={() => { setCourseForm(BLANK_COURSE); setCourseModal('create') }}>
              {t('instructor.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {courses.map((course) => (
              <div key={course.id} className="card">
                <div style={{ height:3, background: course.is_published ? 'var(--mint)' : 'var(--border)' }} />
                <div className="card-body">
                  <div style={{ display:'flex', gap:'.375rem', flexWrap:'wrap', marginBottom:'.625rem' }}>
                    <span className={`badge ${course.is_published ? 'badge-mint' : 'badge-neutral'}`}>
                      {course.is_published ? t('instructor.published') : t('instructor.draft')}
                    </span>
                    <span className="badge badge-dark">{course.level}</span>
                    {course.watermark_enabled && (
                      <span className="badge badge-neutral" title={t('instructor.watermark')}>🔒 {t('instructor.watermark')}</span>
                    )}
                  </div>

                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', color:'var(--text-1)', marginBottom:'.375rem', lineHeight:1.3 }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize:'.8125rem', color:'var(--text-3)', marginBottom:'.875rem',
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {course.description || t('instructor.noDescription')}
                  </p>

                  <div style={{ display:'flex', gap:'1rem', fontSize:'.8rem', color:'var(--text-3)', fontWeight:500, marginBottom:'1.125rem' }}>
                    <span>📖 {course.total_lessons} {t('common.lessons')}</span>
                    <span>{Number(course.price)===0 ? `🆓 ${t('common.free')}` : `💰 $${Number(course.price).toFixed(2)}`}</span>
                  </div>

                  {/* Publish toggle */}
                  <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.75rem', padding:'.625rem .75rem', background:'var(--surface-2,rgba(255,255,255,.04))', borderRadius:'10px' }}>
                    <span style={{ fontSize:'.8125rem', fontWeight:600, color:'var(--text-2)', flex:1 }}>
                      {course.is_published ? '🟢 منشور' : '⚪ مسودة'}
                    </span>
                    <button
                      className={`btn btn-sm ${course.is_published ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => togglePublish(course)}
                      style={{ minWidth:'90px' }}
                    >
                      {course.is_published ? t('instructor.unpublish') : '🚀 ' + t('instructor.publish')}
                    </button>
                  </div>

                  <div style={{ display:'flex', gap:'.375rem', flexWrap:'wrap' }}>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setCourseForm({ ...course, price:String(course.price), category_id:course.category?.id||'' }); setCourseModal(course) }}>
                      {t('instructor.edit')}
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setChapterModal({ courseId:course.id }); setChapterForm(BLANK_CHAPTER) }}>
                      {t('instructor.addChapter')}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleContent(course.id)}>
                      {expanded[course.id] ? t('instructor.hideContent') : t('instructor.showContent')}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)}>{t('instructor.delete')}</button>
                  </div>

                  {expanded[course.id] && (
                    <div style={{ marginTop:'1rem' }}>
                      {detailsLoading[course.id] ? (
                        <div style={{ textAlign:'center', padding:'1rem', color:'var(--text-3)', fontSize:'.8125rem' }}>…</div>
                      ) : !courseDetails[course.id]?.chapters?.length ? (
                        <p style={{ fontSize:'.8125rem', color:'var(--text-3)', textAlign:'center', padding:'.75rem 0' }}>
                          {t('instructor.noChaptersYet')}
                        </p>
                      ) : (
                        courseDetails[course.id].chapters
                          .slice().sort((a, b) => a.order - b.order)
                          .map((ch) => (
                            <div key={ch.id} className="chapter-block">
                              <div className="chapter-header">
                                <span className="chapter-title">{ch.title}</span>
                                <button type="button" className="btn btn-secondary btn-sm"
                                  onClick={() => { setLessonModal({ courseId:course.id, chapterId:ch.id }); setLessonForm(BLANK_LESSON) }}>
                                  {t('instructor.addLesson')}
                                </button>
                              </div>
                              <div className="chapter-body">
                                {!ch.lessons?.length ? (
                                  <p style={{ fontSize:'.8125rem', color:'var(--text-3)', textAlign:'center', padding:'.5rem 0' }}>
                                    {t('instructor.noLessonsYet')}
                                  </p>
                                ) : (
                                  ch.lessons.slice().sort((a, b) => a.order - b.order).map((les) => (
                                    <div key={les.id} className="lesson-row" style={{ cursor:'default' }}>
                                      <div className="lesson-row-left">
                                        <span className="lesson-row-icon">{les.video_url ? '🎬' : '⚠️'}</span>
                                        <span className="lesson-row-title">{les.title}</span>
                                      </div>
                                      <span className="lesson-row-dur">
                                        {les.video_url ? t('instructor.videoReady') : t('instructor.noVideoYet')}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course modal */}
      {courseModal && (
        <Modal title={courseModal==='create' ? t('instructor.modal.createCourse') : t('instructor.modal.editCourse')} onClose={() => setCourseModal(null)}>
          <form onSubmit={saveCourse}>
            <Field label={t('instructor.modal.titleField')}>
              <input className="input" value={courseForm.title} onChange={cf('title')} required />
            </Field>
            <Field label={t('instructor.modal.slugField')}>
              <input className="input" value={courseForm.slug} onChange={cf('slug')} required placeholder="my-course-slug" />
            </Field>
            <Field label={t('instructor.modal.descriptionField')}>
              <textarea className="input" rows={3} value={courseForm.description} onChange={cf('description')} />
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.625rem' }}>
              <Field label={t('instructor.modal.levelField')}>
                <select className="input" value={courseForm.level} onChange={cf('level')}>
                  {['beginner','intermediate','advanced'].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                </select>
              </Field>
              <Field label={t('instructor.modal.languageField')}>
                <input className="input" value={courseForm.language} onChange={cf('language')} />
              </Field>
              <Field label={t('instructor.modal.priceField')}>
                <input className="input" type="number" step="0.01" min="0" value={courseForm.price} onChange={cf('price')} />
              </Field>
              <Field label={t('instructor.modal.categoryField')}>
                <select className="input" value={courseForm.category_id} onChange={cf('category_id')}>
                  <option value="">{t('instructor.modal.noneCategory')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'flex', gap:'1.5rem', padding:'.5rem 0 .25rem' }}>
              {[['is_free', t('instructor.modal.freeCourse')], ['watermark_enabled', t('instructor.modal.enableWatermark')]].map(([k,lbl]) => (
                <label key={k} style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
                  fontSize:'.875rem', fontWeight:600, color:'var(--text-2)' }}>
                  <input type="checkbox" checked={courseForm[k]} onChange={cf(k)}
                    style={{ accentColor:'var(--mint)', width:15, height:15 }} />
                  {lbl}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCourseModal(null)}>{t('instructor.modal.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('instructor.modal.saving') : t('instructor.modal.saveCourse')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Chapter modal */}
      {chapterModal && (
        <Modal title={t('instructor.modal.addChapterTitle')} onClose={() => setChapterModal(null)}>
          <form onSubmit={saveChapter}>
            <Field label={t('instructor.modal.titleField')}>
              <input className="input" value={chapterForm.title} onChange={chf('title')} required />
            </Field>
            <Field label={t('instructor.modal.orderField')}>
              <input className="input" type="number" value={chapterForm.order} onChange={chf('order')} />
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
              fontSize:'.875rem', fontWeight:600, color:'var(--text-2)', marginBottom:'1rem' }}>
              <input type="checkbox" checked={chapterForm.is_free_preview} onChange={chf('is_free_preview')}
                style={{ accentColor:'var(--mint)', width:15, height:15 }} />
              {t('instructor.modal.freePreviewChapter')}
            </label>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setChapterModal(null)}>{t('instructor.modal.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('instructor.modal.saving') : t('instructor.modal.addChapterBtn')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lesson modal */}
      {lessonModal && (
        <Modal title={t('instructor.modal.addLessonTitle')} onClose={() => setLessonModal(null)}>
          <form onSubmit={saveLesson}>
            <Field label={t('instructor.modal.titleField')}>
              <input className="input" value={lessonForm.title} onChange={lf('title')} required />
            </Field>
            <Field label={t('instructor.modal.videoUrlField')}>
              <div className="upload-field">
                <span className="upload-status">
                  {lessonForm.video_url ? '✓ Video uploaded' : 'No video uploaded yet'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg,.mov"
                  style={{ display: 'none' }}
                  onChange={handleVideoFile}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={uploadProgress !== null}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadProgress !== null ? `Uploading ${uploadProgress}%` : '📁 Upload video'}
                </button>
              </div>
              {uploadProgress !== null && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.625rem' }}>
              <Field label={t('instructor.modal.durationField')}>
                <input className="input" type="number" value={lessonForm.duration_seconds} onChange={lf('duration_seconds')} />
              </Field>
              <Field label={t('instructor.modal.orderField')}>
                <input className="input" type="number" value={lessonForm.order} onChange={lf('order')} />
              </Field>
            </div>
            <Field label={t('instructor.modal.descriptionField')}>
              <textarea className="input" rows={2} value={lessonForm.description} onChange={lf('description')} />
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
              fontSize:'.875rem', fontWeight:600, color:'var(--text-2)', marginBottom:'1rem' }}>
              <input type="checkbox" checked={lessonForm.is_preview} onChange={lf('is_preview')}
                style={{ accentColor:'var(--mint)', width:15, height:15 }} />
              {t('instructor.modal.freePreviewLesson')}
            </label>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setLessonModal(null)}>{t('instructor.modal.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('instructor.modal.saving') : t('instructor.modal.addLessonBtn')}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
