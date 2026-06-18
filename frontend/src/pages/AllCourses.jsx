import { useEffect, useState } from 'react'
import { listCourses, listCategories } from '../api/courses'
import CourseCard from '../components/CourseCard'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'

const LEVELS = [
  { value: '',             label: 'الكل' },
  { value: 'beginner',    label: 'مبتدئ' },
  { value: 'intermediate',label: 'متوسط' },
  { value: 'advanced',    label: 'متقدم' },
]

const PRICES = [
  { value: '',     label: 'الكل' },
  { value: 'true', label: 'مجاني' },
  { value: 'false',label: 'مدفوع' },
]

function FilterChip({ label, onRemove }) {
  return (
    <span className="ac-chip">
      {label}
      <button onClick={onRemove} aria-label="إزالة الفلتر"><XMarkIcon /></button>
    </span>
  )
}

export default function AllCourses() {
  const { t } = useTranslation()
  const [courses, setCourses]       = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters]       = useState({ search: '', category: '', level: '', is_free: '' })

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.search)    params.search   = filters.search
    if (filters.category)  params.category = filters.category
    if (filters.level)     params.level    = filters.level
    if (filters.is_free !== '') params.is_free = filters.is_free === 'true'
    listCourses(params)
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [filters])

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const clearAll = () => setFilters({ search: '', category: '', level: '', is_free: '' })

  const activeChips = [
    filters.category && { key: 'category', label: categories.find(c => c.slug === filters.category)?.name || filters.category },
    filters.level    && { key: 'level',    label: LEVELS.find(l => l.value === filters.level)?.label },
    filters.is_free  && { key: 'is_free',  label: PRICES.find(p => p.value === filters.is_free)?.label },
  ].filter(Boolean)

  const hasFilters = activeChips.length > 0 || filters.search

  return (
    <div className="ac-root" dir="rtl">

      {/* ── Hero bar ── */}
      <div className="ac-hero">
        <div className="container">
          <div className="ac-hero-inner">
            <div className="ac-hero-text">
              <h1 className="ac-hero-title">{t('catalog.allCourses')}</h1>
              <p className="ac-hero-sub">{t('catalog.heroSubtitle')}</p>
            </div>
            <div className="ac-search-wrap">
              <MagnifyingGlassIcon className="ac-search-icon" />
              <input
                className="ac-search"
                placeholder={t('catalog.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => set('search', e.target.value)}
              />
              {filters.search && (
                <button className="ac-search-clear" onClick={() => set('search', '')}>
                  <XMarkIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container ac-body">

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && <div className="ac-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── Filter sidebar ── */}
        <aside className={`ac-sidebar${sidebarOpen ? ' ac-sidebar--open' : ''}`}>
          <div className="ac-sidebar-header">
            <span className="ac-sidebar-title">الفلاتر</span>
            {hasFilters && (
              <button className="ac-clear-btn" onClick={clearAll}>مسح الكل</button>
            )}
          </div>

          {/* Category */}
          <div className="ac-filter-group">
            <div className="ac-filter-label">الفئة</div>
            <div className="ac-filter-options">
              {[{ id: '', name: 'الكل' }, ...categories].map((c) => (
                <button
                  key={c.id ?? 'all'}
                  className={`ac-filter-opt${filters.category === (c.slug ?? '') ? ' ac-filter-opt--active' : ''}`}
                  onClick={() => set('category', c.slug ?? '')}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div className="ac-filter-group">
            <div className="ac-filter-label">المستوى</div>
            <div className="ac-filter-options">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  className={`ac-filter-opt${filters.level === l.value ? ' ac-filter-opt--active' : ''}`}
                  onClick={() => set('level', l.value)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="ac-filter-group">
            <div className="ac-filter-label">السعر</div>
            <div className="ac-filter-options">
              {PRICES.map((p) => (
                <button
                  key={p.value}
                  className={`ac-filter-opt${filters.is_free === p.value ? ' ac-filter-opt--active' : ''}`}
                  onClick={() => set('is_free', p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="ac-main">

          {/* Toolbar */}
          <div className="ac-toolbar">
            <div className="ac-toolbar-right">
              <button className="ac-filter-toggle" onClick={() => setSidebarOpen(o => !o)}>
                <AdjustmentsHorizontalIcon />
                الفلاتر
              </button>
              {activeChips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={() => set(chip.key, '')} />
              ))}
            </div>
            <span className="ac-count">
              {loading ? '…' : `${courses.length} ${t('common.courses')}`}
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="ac-loading">
              <div className="db-spinner" />
              <span>جارٍ التحميل…</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon">🎓</div>
              <h3>{t('catalog.noCoursesTitle')}</h3>
              <p>{t('catalog.noCoursesSub')}</p>
              {hasFilters && (
                <button className="db-btn db-btn--ghost" onClick={clearAll}>مسح الفلاتر</button>
              )}
            </div>
          ) : (
            <div className="ac-grid">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
