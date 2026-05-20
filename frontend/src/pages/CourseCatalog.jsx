import { useEffect, useState } from 'react'
import { listCourses, listCategories } from '../api/courses'
import CourseCard from '../components/CourseCard'

export default function CourseCatalog() {
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
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.level) params.level = filters.level
    if (filters.is_free !== '') params.is_free = filters.is_free === 'true'
    listCourses(params)
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [filters])

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>Explore Courses</h1>
        <p>Grow your skills with expert-led courses</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        <input
          className="form-control" style={{ maxWidth: 280 }}
          placeholder="Search courses…" value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={filters.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="form-control" style={{ maxWidth: 160 }} value={filters.level} onChange={(e) => set('level', e.target.value)}>
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select className="form-control" style={{ maxWidth: 140 }} value={filters.is_free} onChange={(e) => set('is_free', e.target.value)}>
          <option value="">Any Price</option>
          <option value="true">Free</option>
          <option value="false">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : courses.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '4rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <p>No courses found. Try adjusting the filters.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  )
}
