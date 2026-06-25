import { useEffect, useRef, useState } from 'react'
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  addChapter, updateChapter, deleteChapter,
  addLesson, updateLesson, deleteLesson,
  listCategories, uploadVideo,
} from '../api/courses'

/* ── tiny helpers ── */
const BLANK_COURSE = { title: '', description: '', price: '0', is_free: true, level: 'beginner', language: 'Arabic', category_id: '', watermark_enabled: true }

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/* ════════════════════════════════════════════════════════════════
   LESSON ROW — inline title + video upload
════════════════════════════════════════════════════════════════ */
function LessonRow({ lesson, courseId, chapterId, onUpdate, onDelete }) {
  const [title, setTitle] = useState(lesson.title)
  const [saving, setSaving] = useState(false)
  const [uploadPct, setUploadPct] = useState(null)
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '')
  const fileRef = useRef()

  const saveTitle = async () => {
    if (title === lesson.title) return
    setSaving(true)
    try {
      const { data } = await updateLesson(courseId, chapterId, lesson.id, { title })
      onUpdate(data)
    } finally { setSaving(false) }
  }

  const handleVideo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadPct(0)
    try {
      const { data } = await uploadVideo(file, setUploadPct)
      setVideoUrl(data.url)
      const { data: updated } = await updateLesson(courseId, chapterId, lesson.id, { video_url: data.url })
      onUpdate(updated)
    } finally { setUploadPct(null) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .75rem', background: 'var(--surface-2,rgba(255,255,255,.04))', borderRadius: '8px', marginBottom: '.375rem' }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{videoUrl ? '🎬' : '⚠️'}</span>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={saveTitle}
        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-1)', fontSize: '.875rem', padding: '.2rem .1rem', outline: 'none' }}
        placeholder="عنوان الدرس"
      />

      {uploadPct !== null ? (
        <span style={{ fontSize: '.75rem', color: 'var(--mint)', whiteSpace: 'nowrap' }}>{uploadPct}%</span>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ fontSize: '.75rem', padding: '.25rem .6rem', background: videoUrl ? 'rgba(44,193,148,.15)' : 'rgba(255,255,255,.07)', border: '1px solid var(--border)', borderRadius: '6px', color: videoUrl ? 'var(--mint)' : 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {videoUrl ? '✓ فيديو' : '📁 رفع'}
        </button>
      )}

      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideo} />

      <button
        type="button"
        onClick={() => onDelete(lesson.id)}
        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1rem', padding: '0 .2rem', flexShrink: 0 }}
        title="حذف الدرس"
      >✕</button>

      {saving && <span style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>…</span>}

      {uploadPct !== null && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--border)' }}>
          <div style={{ width: `${uploadPct}%`, height: '100%', background: 'var(--mint)', transition: 'width .2s' }} />
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   CHAPTER BLOCK — collapsible, inline lesson management
════════════════════════════════════════════════════════════════ */
function ChapterBlock({ chapter, courseId, onChapterUpdate, onChapterDelete }) {
  const [open, setOpen] = useState(true)
  const [title, setTitle] = useState(chapter.title)
  const [lessons, setLessons] = useState(chapter.lessons || [])
  const [addingLesson, setAddingLesson] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const saveTitle = async () => {
    if (title === chapter.title) return
    await updateChapter(courseId, chapter.id, { title })
    onChapterUpdate({ ...chapter, title })
  }

  const addNewLesson = async () => {
    if (!newLessonTitle.trim()) return
    setSaving(true)
    try {
      const { data } = await addLesson(courseId, chapter.id, { title: newLessonTitle, order: lessons.length })
      setLessons(ls => [...ls, data])
      setNewLessonTitle('')
      setAddingLesson(false)
    } finally { setSaving(false) }
  }

  const handleLessonUpdate = (updated) => setLessons(ls => ls.map(l => l.id === updated.id ? updated : l))

  const handleLessonDelete = async (lessonId) => {
    if (!confirm('حذف هذا الدرس؟')) return
    await deleteLesson(courseId, chapter.id, lessonId)
    setLessons(ls => ls.filter(l => l.id !== lessonId))
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '.75rem', overflow: 'hidden' }}>
      {/* Chapter header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.625rem .875rem', background: 'var(--surface-1,rgba(255,255,255,.06))' }}>
        <button type="button" onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: '.9rem', padding: 0, flexShrink: 0 }}>
          {open ? '▾' : '▸'}
        </button>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-1)', fontWeight: 600, fontSize: '.9rem', padding: '.2rem .1rem', outline: 'none' }}
          placeholder="عنوان الفصل"
        />

        <span style={{ fontSize: '.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{lessons.length} درس</span>

        <button type="button" onClick={() => onChapterDelete(chapter.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1rem', padding: '0 .2rem' }} title="حذف الفصل">🗑</button>
      </div>

      {/* Lessons */}
      {open && (
        <div style={{ padding: '.625rem .875rem' }}>
          {lessons.sort((a, b) => a.order - b.order).map(l => (
            <LessonRow
              key={l.id}
              lesson={l}
              courseId={courseId}
              chapterId={chapter.id}
              onUpdate={handleLessonUpdate}
              onDelete={handleLessonDelete}
            />
          ))}

          {addingLesson ? (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.375rem' }}>
              <input
                autoFocus
                value={newLessonTitle}
                onChange={e => setNewLessonTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNewLesson()}
                placeholder="عنوان الدرس الجديد…"
                style={{ flex: 1, background: 'var(--surface-2,rgba(255,255,255,.04))', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-1)', fontSize: '.875rem', padding: '.375rem .625rem', outline: 'none' }}
              />
              <button type="button" onClick={addNewLesson} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? '…' : 'إضافة'}
              </button>
              <button type="button" onClick={() => { setAddingLesson(false); setNewLessonTitle('') }} className="btn btn-secondary btn-sm">إلغاء</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingLesson(true)} style={{ marginTop: '.375rem', background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-3)', cursor: 'pointer', fontSize: '.8rem', padding: '.375rem .75rem', width: '100%' }}>
              + إضافة درس
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COURSE EDITOR — full single-page editor
════════════════════════════════════════════════════════════════ */
function CourseEditor({ course: initial, categories, onSave, onBack }) {
  const [form, setForm] = useState({ ...initial, price: String(initial.price), category_id: initial.category?.id || '' })
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [addingChapter, setAddingChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  useEffect(() => {
    getCourse(initial.id).then(r => setChapters(r.data.chapters || [])).finally(() => setLoading(false))
  }, [initial.id])

  const cf = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const saveCourse = async () => {
    setSaving(true)
    try {
      const { data } = await updateCourse(initial.id, { ...form, price: 0, is_free: true, category_id: form.category_id || null })
      onSave(data)
      flash('✅ تم الحفظ')
    } catch (e) { flash('❌ ' + (e.response?.data?.detail || 'فشل الحفظ')) }
    finally { setSaving(false) }
  }

  const togglePublish = async () => {
    setSaving(true)
    try {
      const { data } = await updateCourse(initial.id, { is_published: !form.is_published })
      setForm(f => ({ ...f, is_published: data.is_published }))
      onSave(data)
      flash(data.is_published ? '🟢 تم النشر' : '⚪ تم إلغاء النشر')
    } finally { setSaving(false) }
  }

  const addNewChapter = async () => {
    if (!newChapterTitle.trim()) return
    setSaving(true)
    try {
      const { data } = await addChapter(initial.id, { title: newChapterTitle, order: chapters.length })
      setChapters(cs => [...cs, { ...data, lessons: [] }])
      setNewChapterTitle('')
      setAddingChapter(false)
    } finally { setSaving(false) }
  }

  const handleChapterUpdate = updated => setChapters(cs => cs.map(c => c.id === updated.id ? { ...c, ...updated } : c))

  const handleChapterDelete = async id => {
    if (!confirm('حذف هذا الفصل وكل دروسه؟')) return
    await deleteChapter(initial.id, id)
    setChapters(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">← رجوع</button>
        <h2 style={{ flex: 1, margin: 0, fontWeight: 700, color: 'var(--text-1)', fontSize: '1.1rem' }}>{form.title || 'دورة جديدة'}</h2>
        <span style={{ fontSize: '.85rem', fontWeight: 600, color: form.is_published ? 'var(--mint)' : 'var(--text-3)' }}>
          {form.is_published ? '🟢 منشور' : '⚪ مسودة'}
        </span>
        <button type="button" onClick={togglePublish} disabled={saving} className={`btn btn-sm ${form.is_published ? 'btn-danger' : 'btn-primary'}`}>
          {form.is_published ? 'إلغاء النشر' : '🚀 نشر'}
        </button>
        <button type="button" onClick={saveCourse} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? '…' : '💾 حفظ'}
        </button>
      </div>

      {msg && <div style={{ padding: '.5rem 1rem', borderRadius: '8px', background: 'rgba(44,193,148,.15)', color: 'var(--mint)', marginBottom: '1rem', fontSize: '.875rem' }}>{msg}</div>}

      {/* Course info */}
      <div style={{ background: 'var(--surface-1,rgba(255,255,255,.05))', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--text-1)', fontSize: '.95rem' }}>معلومات الدورة</h3>

        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.25rem' }}>عنوان الدورة *</label>
          <input className="input" value={form.title} onChange={e => { cf('title')(e); if (!initial.title) setForm(f => ({ ...f, slug: slugify(e.target.value) })) }} placeholder="عنوان الدورة" />
        </div>

        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.25rem' }}>وصف الدورة</label>
          <textarea className="input" rows={3} value={form.description} onChange={cf('description')} placeholder="وصف مختصر للدورة…" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.25rem' }}>التصنيف</label>
            <select className="input" value={form.category_id} onChange={cf('category_id')}>
              <option value="">— بدون تصنيف —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.25rem' }}>المستوى</label>
            <select className="input" value={form.level} onChange={cf('level')}>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.875rem', color: 'var(--text-2)' }}>
              <input type="checkbox" checked={form.is_free} onChange={cf('is_free')} style={{ accentColor: 'var(--mint)' }} />
              دورة مجانية
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.875rem', color: 'var(--text-2)' }}>
              <input type="checkbox" checked={form.watermark_enabled} onChange={cf('watermark_enabled')} style={{ accentColor: 'var(--mint)' }} />
              حماية الفيديو (علامة مائية)
            </label>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)', fontSize: '.95rem' }}>
          الفصول — {chapters.length} فصل · {chapters.reduce((s, c) => s + (c.lessons?.length || 0), 0)} درس
        </h3>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)' }}>جارٍ التحميل…</div>
      ) : (
        <>
          {chapters.sort((a, b) => a.order - b.order).map(ch => (
            <ChapterBlock
              key={ch.id}
              chapter={ch}
              courseId={initial.id}
              onChapterUpdate={handleChapterUpdate}
              onChapterDelete={handleChapterDelete}
            />
          ))}

          {addingChapter ? (
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
              <input
                autoFocus
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNewChapter()}
                placeholder="عنوان الفصل الجديد…"
                className="input"
              />
              <button type="button" onClick={addNewChapter} disabled={saving} className="btn btn-primary btn-sm">{saving ? '…' : 'إضافة'}</button>
              <button type="button" onClick={() => { setAddingChapter(false); setNewChapterTitle('') }} className="btn btn-secondary btn-sm">إلغاء</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingChapter(true)} style={{ background: 'none', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--text-3)', cursor: 'pointer', fontSize: '.875rem', padding: '.75rem', width: '100%', marginBottom: '.75rem' }}>
              + إضافة فصل جديد
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN PANEL
════════════════════════════════════════════════════════════════ */
export default function InstructorPanel() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState(BLANK_COURSE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      listCourses({ page: 1, page_size: 100 }).then(r => setCourses(r.data)),
      listCategories().then(r => setCategories(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const flash = (m, isErr = false) => {
    isErr ? setErr(m) : setMsg(m)
    setTimeout(() => { setMsg(''); setErr('') }, 4000)
  }

  const createNew = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await createCourse({ ...newForm, price: Number(newForm.price) || 0, category_id: newForm.category_id || null })
      setCourses(cs => [data, ...cs])
      setCreating(false)
      setNewForm(BLANK_COURSE)
      setEditing(data)
    } catch (e) { flash(e.response?.data?.detail || 'فشل الإنشاء', true) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return
    try {
      await deleteCourse(id)
      setCourses(cs => cs.filter(c => c.id !== id))
      flash('تم حذف الدورة')
    } catch (e) { flash(e.response?.data?.detail || 'فشل الحذف', true) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  /* ── Editor view ── */
  if (editing) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <CourseEditor
        course={editing}
        categories={categories}
        onSave={updated => setCourses(cs => cs.map(c => c.id === updated.id ? updated : c))}
        onBack={() => setEditing(null)}
      />
    </div>
  )

  /* ── List view ── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="page-hero">
        <div className="container page-hero-content" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="page-hero-eyebrow">لوحة المدرّب</p>
            <h1>دوراتي</h1>
            <p>{courses.length} دورة</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => { setNewForm(BLANK_COURSE); setCreating(true) }}>
            + دورة جديدة
          </button>
        </div>
      </div>

      <div className="container page-body" style={{ paddingTop: '1.75rem' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {/* New course quick-form */}
        {creating && (
          <form onSubmit={createNew} style={{ background: 'var(--surface-1,rgba(255,255,255,.05))', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--mint)' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--mint)' }}>إنشاء دورة جديدة</h3>
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.8rem', color: 'var(--text-2)' }}>عنوان الدورة *</label>
              <input className="input" required value={newForm.title}
                onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                placeholder="مثال: دورة اضطرابات التعلم" />
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} className="btn btn-secondary">إلغاء</button>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? '…' : 'إنشاء وتحرير'}</button>
            </div>
          </form>
        )}

        {!courses.length ? (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <h3>لا توجد دورات بعد</h3>
            <p>أنشئ دورتك الأولى الآن</p>
            <button className="btn btn-primary" onClick={() => { setNewForm(BLANK_COURSE); setCreating(true) }}>إنشاء دورة</button>
          </div>
        ) : (
          <div className="grid grid-2">
            {courses.map(course => (
              <div key={course.id} className="card" style={{ cursor: 'default' }}>
                <div style={{ height: 3, background: course.is_published ? 'var(--mint)' : 'var(--border)' }} />
                <div className="card-body">
                  {/* Status + title */}
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: '20px', background: course.is_published ? 'rgba(44,193,148,.15)' : 'rgba(255,255,255,.06)', color: course.is_published ? 'var(--mint)' : 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {course.is_published ? '🟢 منشور' : '⚪ مسودة'}
                    </span>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', lineHeight: 1.3 }}>{course.title}</h3>
                  </div>

                  <p style={{ fontSize: '.8125rem', color: 'var(--text-3)', marginBottom: '.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description || '—'}
                  </p>

                  <div style={{ fontSize: '.8rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                    📖 {course.total_lessons} درس
                  </div>

                  <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setEditing(course)}>✏️ تحرير</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)}>🗑 حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
