import { useEffect, useState } from 'react'
import { listCourses, listCategories } from '../api/courses'
import CourseCard from '../components/CourseCard'
import { useTranslation } from 'react-i18next'

export default function CourseCatalog() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', category: '', level: '', is_free: '' })

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.search)   params.search   = filters.search
    if (filters.category) params.category = filters.category
    if (filters.level)    params.level    = filters.level
    if (filters.is_free !== '') params.is_free = filters.is_free === 'true'
    listCourses(params)
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [filters])

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="hero-pills">
          {[0,1,2].map((row) => (
            <div key={row} className="hero-pills-row">
              {[0,1,2,3].map((col) => <div key={col} className="hero-pill-el" />)}
            </div>
          ))}
        </div>
        <div className="container page-hero-content">
          <p className="page-hero-eyebrow">{t('catalog.eyebrow')}</p>
          <h1>
            {t('catalog.heroTitle')}<br />
            <em>{t('catalog.heroEmphasis')}</em>
          </h1>
          <p>{t('catalog.heroSubtitle')}</p>
        </div>
      </div>

      {/* Catalog */}
      <div className="container page-body" id="courses">
        <div className="section-heading">
          <h2>{t('catalog.allCourses')}</h2>
          {!loading && (
            <span style={{ fontSize: '.875rem', color: 'var(--text-3)', fontWeight: 500 }}>
              {courses.length} {t('common.courses')}
            </span>
          )}
        </div>

        <div className="filter-bar">
          <input className="input" style={{ flex: 1, minWidth: 180 }}
            placeholder={t('catalog.searchPlaceholder')} value={filters.search}
            onChange={(e) => set('search', e.target.value)} />
          <select className="input" style={{ minWidth: 150 }}
            value={filters.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">{t('catalog.allCategories')}</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="input" style={{ minWidth: 130 }}
            value={filters.level} onChange={(e) => set('level', e.target.value)}>
            <option value="">{t('catalog.allLevels')}</option>
            <option value="beginner">{t('catalog.beginner')}</option>
            <option value="intermediate">{t('catalog.intermediate')}</option>
            <option value="advanced">{t('catalog.advanced')}</option>
          </select>
          <select className="input" style={{ minWidth: 110 }}
            value={filters.is_free} onChange={(e) => set('is_free', e.target.value)}>
            <option value="">{t('catalog.anyPrice')}</option>
            <option value="true">{t('catalog.free')}</option>
            <option value="false">{t('catalog.paid')}</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <h3>{t('catalog.noCoursesTitle')}</h3>
            <p>{t('catalog.noCoursesSub')}</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </>
  )
}
