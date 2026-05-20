import { useEffect, useState } from 'react'
import {
  getStats, listUsers, updateUser, deleteUser,
  listAllCourses, adminUpdateCourse, adminDeleteCourse,
  listCategories, createCategory, deleteCategory,
  listAllPayments,
} from '../api/admin'

// ── Tiny reusable components ────────────────────────────────────────────────

function StatCard({ num, label, sub, color = 'var(--mint)' }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{num}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.875rem', color: 'var(--text-1)', marginTop: '.5rem' }}>{label}</div>
        {sub && <div style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: '.2rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

function Table({ cols, rows, empty = 'No records found.' }) {
  if (!rows.length) return (
    <div className="empty"><div className="empty-icon">📭</div><p>{empty}</p></div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {cols.map((c) => (
              <th key={c} style={{ padding: '.6rem .875rem', textAlign: 'left', fontFamily: 'var(--font-display)',
                fontSize: '.75rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.05em',
                textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '.75rem .875rem', color: 'var(--text-2)', verticalAlign: 'middle' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <input className="input" style={{ maxWidth: 300 }}
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  )
}

// ── Main panel ──────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [tab, setTab]         = useState('stats')
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [courses, setCourses] = useState([])
  const [cats, setCats]       = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')
  const [userSearch, setUserSearch]     = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [newCat, setNewCat]   = useState({ name: '', slug: '', description: '' })
  const [showCatForm, setShowCatForm] = useState(false)

  const flash = (m, isErr = false) => {
    isErr ? setErr(m) : setMsg(m)
    setTimeout(() => { setMsg(''); setErr('') }, 4000)
  }

  // Load on tab switch
  useEffect(() => {
    setLoading(true)
    const loaders = {
      stats:    () => getStats().then((r) => setStats(r.data)),
      users:    () => listUsers().then((r) => setUsers(r.data)),
      courses:  () => listAllCourses().then((r) => setCourses(r.data)),
      cats:     () => listCategories().then((r) => setCats(r.data)),
      payments: () => listAllPayments().then((r) => setPayments(r.data)),
    }
    loaders[tab]?.().catch(() => {}).finally(() => setLoading(false))
  }, [tab])

  // ── Users ──────────────────────────────────────────────────────────────────

  const handleRoleChange = async (user, role) => {
    try {
      const { data } = await updateUser(user.id, { role })
      setUsers((us) => us.map((u) => u.id === data.id ? data : u))
      flash(`${user.full_name} is now ${role}`)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const handleToggleActive = async (user) => {
    try {
      const { data } = await updateUser(user.id, { is_active: !user.is_active })
      setUsers((us) => us.map((u) => u.id === data.id ? data : u))
      flash(`${user.full_name} ${data.is_active ? 'activated' : 'suspended'}`)
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const handleDeleteUser = async (user) => {
    if (!confirm(`Delete user "${user.full_name}"? This cannot be undone.`)) return
    try {
      await deleteUser(user.id)
      setUsers((us) => us.filter((u) => u.id !== user.id))
      flash('User deleted')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const filteredUsers = users.filter((u) =>
    !userSearch || u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  // ── Courses ────────────────────────────────────────────────────────────────

  const handleTogglePublish = async (course) => {
    try {
      const { data } = await adminUpdateCourse(course.id, { is_published: !course.is_published })
      setCourses((cs) => cs.map((c) => c.id === data.id ? data : c))
      flash(data.is_published ? 'Course published' : 'Course unpublished')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const handleDeleteCourse = async (course) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return
    try {
      await adminDeleteCourse(course.id)
      setCourses((cs) => cs.filter((c) => c.id !== course.id))
      flash('Course deleted')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const filteredCourses = courses.filter((c) =>
    !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  // ── Categories ─────────────────────────────────────────────────────────────

  const handleCreateCat = async (e) => {
    e.preventDefault()
    try {
      const { data } = await createCategory(newCat)
      setCats((cs) => [...cs, data])
      setNewCat({ name: '', slug: '', description: '' })
      setShowCatForm(false)
      flash('Category created')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const handleDeleteCat = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    try {
      await deleteCategory(cat.id)
      setCats((cs) => cs.filter((c) => c.id !== cat.id))
      flash('Category deleted')
    } catch (e) { flash(e.response?.data?.detail || 'Failed', true) }
  }

  const TABS = [
    { key: 'stats',    label: '📊 Overview' },
    { key: 'users',    label: '👥 Users' },
    { key: 'courses',  label: '🎓 Courses' },
    { key: 'cats',     label: '🏷️ Categories' },
    { key: 'payments', label: '💳 Payments' },
  ]

  const roleBadge = (role) => {
    const map = { admin: 'badge-dark', instructor: 'badge-mint', student: 'badge-neutral' }
    return <span className={`badge ${map[role] || 'badge-neutral'}`}>{role}</span>
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <p className="page-hero-eyebrow">Administration</p>
          <h1>Admin <em>Panel</em></h1>
          <p>Manage users, courses, categories, and monitor platform activity.</p>
        </div>
      </div>

      <div className="container page-body" style={{ paddingTop: '1.75rem' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        <div className="tabs">
          {TABS.map(({ key, label }) => (
            <button key={key} className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'stats' && stats && (
              <div>
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                  <StatCard num={stats.total_users}       label="Total Users"       sub={`${stats.total_instructors} instructors`} />
                  <StatCard num={stats.total_courses}     label="Total Courses"     sub={`${stats.published_courses} published`} />
                  <StatCard num={stats.total_enrollments} label="Enrollments" />
                  <StatCard num={stats.total_payments}    label="Paid Orders" />
                  <StatCard num={`$${Number(stats.total_revenue).toFixed(2)}`} label="Total Revenue" color="var(--amber)" />
                  <StatCard
                    num={`${stats.published_courses && stats.total_courses ? Math.round(stats.published_courses / stats.total_courses * 100) : 0}%`}
                    label="Publish Rate"
                    color="var(--green-600)"
                  />
                </div>

                {/* Quick actions */}
                <h2 className="section-heading" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Quick Actions
                </h2>
                <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                  {[
                    { label: '👥 Manage Users',    tab: 'users' },
                    { label: '🎓 Manage Courses',  tab: 'courses' },
                    { label: '🏷️ Categories',       tab: 'cats' },
                    { label: '💳 View Payments',   tab: 'payments' },
                  ].map((a) => (
                    <button key={a.tab} className="btn btn-secondary" onClick={() => setTab(a.tab)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Users ── */}
            {tab === 'users' && (
              <div>
                <div className="section-heading">
                  <h2>Users <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({filteredUsers.length})</span></h2>
                  <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by name or email…" />
                </div>
                <div className="card">
                  <Table
                    cols={['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions']}
                    rows={filteredUsers.map((u) => [
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{u.full_name}</span>,
                      <span style={{ color: 'var(--text-3)' }}>{u.email}</span>,
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        style={{ fontFamily: 'var(--font-display)', fontSize: '.8rem', fontWeight: 600,
                          border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
                          padding: '.25rem .5rem', background: 'var(--surface)', cursor: 'pointer' }}>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>,
                      <span className={`badge ${u.is_active ? 'badge-mint' : 'badge-neutral'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>,
                      <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>,
                      <div style={{ display: 'flex', gap: '.375rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(u)}>
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>
                          Delete
                        </button>
                      </div>,
                    ])}
                    empty="No users found."
                  />
                </div>
              </div>
            )}

            {/* ── Courses ── */}
            {tab === 'courses' && (
              <div>
                <div className="section-heading">
                  <h2>Courses <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({filteredCourses.length})</span></h2>
                  <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder="Search courses…" />
                </div>
                <div className="card">
                  <Table
                    cols={['Title', 'Price', 'Lessons', 'Status', 'Created', 'Actions']}
                    rows={filteredCourses.map((c) => [
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{c.title}</span>,
                      Number(c.price) === 0
                        ? <span className="badge badge-mint">Free</span>
                        : <span>${Number(c.price).toFixed(2)}</span>,
                      <span>{c.total_lessons}</span>,
                      <span className={`badge ${c.is_published ? 'badge-mint' : 'badge-neutral'}`}>
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>,
                      <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>,
                      <div style={{ display: 'flex', gap: '.375rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePublish(c)}>
                          {c.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(c)}>
                          Delete
                        </button>
                      </div>,
                    ])}
                    empty="No courses found."
                  />
                </div>
              </div>
            )}

            {/* ── Categories ── */}
            {tab === 'cats' && (
              <div>
                <div className="section-heading">
                  <h2>Categories <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({cats.length})</span></h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCatForm((v) => !v)}>
                    {showCatForm ? 'Cancel' : '+ New Category'}
                  </button>
                </div>

                {showCatForm && (
                  <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <div className="card-body">
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.125rem', fontSize: '1rem' }}>
                        New Category
                      </h3>
                      <form onSubmit={handleCreateCat} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '.75rem', alignItems: 'end' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Name *</label>
                          <input className="input" value={newCat.name} required
                            onChange={(e) => setNewCat({ ...newCat, name: e.target.value,
                              slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Slug *</label>
                          <input className="input" value={newCat.slug} required
                            onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Description</label>
                          <input className="input" value={newCat.description}
                            onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary">Create</button>
                      </form>
                    </div>
                  </div>
                )}

                <div className="card">
                  <Table
                    cols={['Name', 'Slug', 'Description', 'Actions']}
                    rows={cats.map((c) => [
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{c.name}</span>,
                      <code style={{ fontSize: '.8rem', background: 'var(--bg-2)', padding: '.15rem .45rem', borderRadius: 4 }}>{c.slug}</code>,
                      <span style={{ color: 'var(--text-3)' }}>{c.description || '—'}</span>,
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(c)}>Delete</button>,
                    ])}
                    empty="No categories yet."
                  />
                </div>
              </div>
            )}

            {/* ── Payments ── */}
            {tab === 'payments' && (
              <div>
                <div className="section-heading">
                  <h2>All Payments <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({payments.length})</span></h2>
                </div>
                <div className="card">
                  <Table
                    cols={['Amount', 'Currency', 'Status', 'Date', 'Payment ID']}
                    rows={payments.map((p) => [
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                        ${Number(p.amount).toFixed(2)}
                      </span>,
                      <span>{p.currency}</span>,
                      <span className={`badge ${
                        p.status === 'completed' ? 'badge-mint'
                        : p.status === 'failed' ? 'badge-neutral'
                        : 'badge-amber'}`}>
                        {p.status}
                      </span>,
                      <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>,
                      <code style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>
                        {p.stripe_payment_intent_id?.slice(0, 20) || '—'}
                      </code>,
                    ])}
                    empty="No payments yet."
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
