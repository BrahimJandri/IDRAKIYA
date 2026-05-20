import { useEffect, useState } from 'react'
import { listCourses, createCourse, updateCourse, deleteCourse, addChapter, addLesson, listCategories } from '../api/courses'

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
  const [courses, setCourses]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [msg, setMsg]   = useState('')
  const [err, setErr]   = useState('')
  const [saving, setSaving] = useState(false)

  const [courseModal,  setCourseModal]  = useState(null)
  const [chapterModal, setChapterModal] = useState(null)
  const [lessonModal,  setLessonModal]  = useState(null)

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
        setCourses((cs) => [data, ...cs]); flash('Course created!')
      } else {
        const { data } = await updateCourse(courseModal.id, payload)
        setCourses((cs) => cs.map((c) => c.id===data.id ? data : c)); flash('Course updated!')
      }
      setCourseModal(null)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
    finally { setSaving(false) }
  }

  const togglePublish = async (course) => {
    try {
      const { data } = await updateCourse(course.id, { is_published: !course.is_published })
      setCourses((cs) => cs.map((c) => c.id===data.id ? data : c))
      flash(data.is_published ? 'Course published!' : 'Course unpublished')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return
    try { await deleteCourse(id); setCourses((cs) => cs.filter((c) => c.id!==id)); flash('Deleted') }
    catch (e) { flash(e.response?.data?.detail || 'Delete failed', true) }
  }

  const saveChapter = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await addChapter(chapterModal.courseId, { ...chapterForm, order: Number(chapterForm.order) })
      flash('Chapter added!'); setChapterModal(null); setChapterForm(BLANK_CHAPTER)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
    finally { setSaving(false) }
  }

  const saveLesson = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...lessonForm, order: Number(lessonForm.order), duration_seconds: Number(lessonForm.duration_seconds)||null }
      await addLesson(lessonModal.courseId, lessonModal.chapterId, payload)
      flash('Lesson added!'); setLessonModal(null); setLessonForm(BLANK_LESSON)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="container page-hero-content" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p className="page-hero-eyebrow">Instructor</p>
            <h1>Your <em>Courses</em></h1>
            <p>{courses.length} course{courses.length!==1?'s':''} total</p>
          </div>
          <button className="btn btn-primary btn-lg"
            onClick={() => { setCourseForm(BLANK_COURSE); setCourseModal('create') }}>
            + New course
          </button>
        </div>
      </div>

      <div className="container page-body" style={{ paddingTop:'1.75rem' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {!courses.length ? (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <h3>No courses yet</h3>
            <p>Create your first course and start teaching.</p>
            <button className="btn btn-primary" onClick={() => { setCourseForm(BLANK_COURSE); setCourseModal('create') }}>
              Create first course
            </button>
          </div>
        ) : (
          <div className="grid grid-2">
            {courses.map((course) => (
              <div key={course.id} className="card">
                {/* Status line */}
                <div style={{ height:3, background: course.is_published ? 'var(--mint)' : 'var(--border)' }} />
                <div className="card-body">
                  <div style={{ display:'flex', gap:'.375rem', flexWrap:'wrap', marginBottom:'.625rem' }}>
                    <span className={`badge ${course.is_published ? 'badge-mint' : 'badge-neutral'}`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge badge-dark">{course.level}</span>
                    {course.watermark_enabled && (
                      <span className="badge badge-neutral" title="Watermark enabled">🔒 Watermark</span>
                    )}
                  </div>

                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', color:'var(--text-1)', marginBottom:'.375rem', lineHeight:1.3 }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize:'.8125rem', color:'var(--text-3)', marginBottom:'.875rem',
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {course.description || 'No description added yet.'}
                  </p>

                  <div style={{ display:'flex', gap:'1rem', fontSize:'.8rem', color:'var(--text-3)', fontWeight:500, marginBottom:'1.125rem' }}>
                    <span>📖 {course.total_lessons} lessons</span>
                    <span>{Number(course.price)===0 ? '🆓 Free' : `💰 $${Number(course.price).toFixed(2)}`}</span>
                  </div>

                  <div style={{ display:'flex', gap:'.375rem', flexWrap:'wrap' }}>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setCourseForm({ ...course, price:String(course.price), category_id:course.category?.id||'' }); setCourseModal(course) }}>
                      Edit
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => togglePublish(course)}>
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { setChapterModal({ courseId:course.id }); setChapterForm(BLANK_CHAPTER) }}>
                      + Chapter
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const chId = prompt('Paste the Chapter ID to add a lesson to:')
                        if (chId) { setLessonModal({ courseId:course.id, chapterId:chId }); setLessonForm(BLANK_LESSON) }
                      }}>
                      + Lesson
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course modal */}
      {courseModal && (
        <Modal title={courseModal==='create' ? 'Create course' : 'Edit course'} onClose={() => setCourseModal(null)}>
          <form onSubmit={saveCourse}>
            <Field label="Title *">
              <input className="input" value={courseForm.title} onChange={cf('title')} required />
            </Field>
            <Field label="Slug *">
              <input className="input" value={courseForm.slug} onChange={cf('slug')} required placeholder="my-course-slug" />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} value={courseForm.description} onChange={cf('description')} />
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.625rem' }}>
              <Field label="Level">
                <select className="input" value={courseForm.level} onChange={cf('level')}>
                  {['beginner','intermediate','advanced'].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <input className="input" value={courseForm.language} onChange={cf('language')} />
              </Field>
              <Field label="Price (USD)">
                <input className="input" type="number" step="0.01" min="0" value={courseForm.price} onChange={cf('price')} />
              </Field>
              <Field label="Category">
                <select className="input" value={courseForm.category_id} onChange={cf('category_id')}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display:'flex', gap:'1.5rem', padding:'.5rem 0 .25rem' }}>
              {[['is_free','Free course'],['watermark_enabled','Enable watermark']].map(([k,lbl]) => (
                <label key={k} style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
                  fontSize:'.875rem', fontWeight:600, color:'var(--text-2)' }}>
                  <input type="checkbox" checked={courseForm[k]} onChange={cf(k)}
                    style={{ accentColor:'var(--mint)', width:15, height:15 }} />
                  {lbl}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCourseModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save course'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Chapter modal */}
      {chapterModal && (
        <Modal title="Add chapter" onClose={() => setChapterModal(null)}>
          <form onSubmit={saveChapter}>
            <Field label="Title *">
              <input className="input" value={chapterForm.title} onChange={chf('title')} required />
            </Field>
            <Field label="Order">
              <input className="input" type="number" value={chapterForm.order} onChange={chf('order')} />
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
              fontSize:'.875rem', fontWeight:600, color:'var(--text-2)', marginBottom:'1rem' }}>
              <input type="checkbox" checked={chapterForm.is_free_preview} onChange={chf('is_free_preview')}
                style={{ accentColor:'var(--mint)', width:15, height:15 }} />
              Free preview chapter
            </label>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setChapterModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add chapter'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lesson modal */}
      {lessonModal && (
        <Modal title="Add lesson" onClose={() => setLessonModal(null)}>
          <form onSubmit={saveLesson}>
            <Field label="Title *">
              <input className="input" value={lessonForm.title} onChange={lf('title')} required />
            </Field>
            <Field label="Video URL">
              <input className="input" value={lessonForm.video_url} onChange={lf('video_url')} placeholder="https://…" />
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.625rem' }}>
              <Field label="Duration (seconds)">
                <input className="input" type="number" value={lessonForm.duration_seconds} onChange={lf('duration_seconds')} />
              </Field>
              <Field label="Order">
                <input className="input" type="number" value={lessonForm.order} onChange={lf('order')} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input" rows={2} value={lessonForm.description} onChange={lf('description')} />
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:'.375rem', cursor:'pointer',
              fontSize:'.875rem', fontWeight:600, color:'var(--text-2)', marginBottom:'1rem' }}>
              <input type="checkbox" checked={lessonForm.is_preview} onChange={lf('is_preview')}
                style={{ accentColor:'var(--mint)', width:15, height:15 }} />
              Free preview lesson
            </label>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setLessonModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add lesson'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
