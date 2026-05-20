import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses, listCategories } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import CourseCard from '../components/CourseCard'

export default function CourseCatalog() {
  const { user } = useAuth()
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
          <p className="page-hero-eyebrow">Online Courses</p>
          <h1>The journey begins<br />with <em>understanding</em></h1>
          <p>Expert-led courses to elevate your knowledge, logic, and professional skills.</p>
          {!user && (
            <div className="page-hero-actions">
              <Link to="/register" className="btn btn-primary btn-xl">Start learning free</Link>
              <a href="#courses" className="btn btn-secondary btn-xl" style={{ color: 'rgba(255,255,255,.75)', background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.12)' }}>
                Browse courses
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Catalog */}
      <div className="container page-body" id="courses">
        <div className="section-heading">
          <h2>All Courses</h2>
          {!loading && <span style={{ fontSize: '.875rem', color: 'var(--text-3)', fontWeight: 500 }}>{courses.length} courses</span>}
        </div>

        <div className="filter-bar">
          <input className="input" style={{ flex: 1, minWidth: 180 }}
            placeholder="Search courses…" value={filters.search}
            onChange={(e) => set('search', e.target.value)} />
          <select className="input" style={{ minWidth: 150 }}
            value={filters.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="input" style={{ minWidth: 130 }}
            value={filters.level} onChange={(e) => set('level', e.target.value)}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select className="input" style={{ minWidth: 110 }}
            value={filters.is_free} onChange={(e) => set('is_free', e.target.value)}>
            <option value="">Any price</option>
            <option value="true">Free</option>
            <option value="false">Paid</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <h3>No courses found</h3>
            <p>Try adjusting the filters or check back later.</p>
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
