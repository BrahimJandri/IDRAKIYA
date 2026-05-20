import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { myEnrollments } from '../api/enrollments'
import { myPayments } from '../api/payments'
import { getSessions, revokeSession, logoutAll, updateMe, changePassword } from '../api/auth'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('learning')
  const [enrollments, setEnrollments] = useState([])
  const [payments, setPayments] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      myEnrollments().then((r) => setEnrollments(r.data)).catch(() => {}),
      myPayments().then((r) => setPayments(r.data)).catch(() => {}),
      getSessions().then((r) => setSessions(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const flash = (m, isErr = false) => {
    isErr ? setErr(m) : setMsg(m)
    setTimeout(() => { setMsg(''); setErr('') }, 4000)
  }

  const handleRevoke = async (id) => {
    await revokeSession(id).catch(() => {})
    setSessions((s) => s.filter((x) => x.id !== id))
  }
  const handleLogoutAll = async () => {
    await logoutAll().catch(() => {})
    logout(); navigate('/login')
  }
  const handleProfile = async (e) => {
    e.preventDefault()
    try { await updateMe(profileForm); flash('Profile updated') }
    catch (e) { flash(e.response?.data?.detail || 'Update failed', true) }
  }
  const handlePwd = async (e) => {
    e.preventDefault()
    try {
      await changePassword(pwdForm)
      flash('Password changed — signing out…')
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (e) { flash(e.response?.data?.detail || 'Change failed', true) }
  }

  const TABS = [
    { key: 'learning', label: 'My courses' },
    { key: 'payments', label: 'Payments' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'profile',  label: 'Profile' },
  ]

  const stats = [
    { num: enrollments.length, label: 'Enrolled' },
    { num: enrollments.filter((e) => e.status === 'active' && e.progress_percent > 0).length, label: 'In progress' },
    { num: enrollments.filter((e) => e.status === 'completed').length, label: 'Completed' },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <p className="page-hero-eyebrow">Dashboard</p>
          <h1>Hello, <em>{user?.full_name?.split(' ')[0]}</em> 👋</h1>
          <div className="stats-row">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-num">{s.num}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container page-body" style={{ paddingTop: '1.75rem' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        <div className="tabs">
          {TABS.map(({ key, label }) => (
            <button key={key} className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => { setTab(key); setMsg(''); setErr('') }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            {/* ── My Courses ── */}
            {tab === 'learning' && (
              !enrollments.length ? (
                <div className="empty">
                  <div className="empty-icon">📖</div>
                  <h3>No courses yet</h3>
                  <p>Enroll in a course to start learning.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/')}>Browse courses</button>
                </div>
              ) : (
                <div className="grid grid-2">
                  {enrollments.map((e) => (
                    <div key={e.id} className="card" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/courses/${e.course_id}`)}>
                      {/* Progress top bar */}
                      <div style={{ height: 3, background: 'var(--bg-2)' }}>
                        <div style={{ height: '100%', width: `${e.progress_percent}%`, background: 'var(--mint)', transition: 'width .5s' }} />
                      </div>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                          <span className={`badge ${e.status === 'completed' ? 'badge-mint' : 'badge-green'}`}>
                            {e.status}
                          </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--mint)' }}>
                            {e.progress_percent}%
                          </span>
                        </div>
                        <div className="progress" style={{ marginBottom: '.875rem' }}>
                          <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                        </div>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-3)', fontWeight: 500 }}>
                          Enrolled {new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {e.completed_at && (
                          <p style={{ fontSize: '.8rem', color: 'var(--mint)', fontWeight: 600, marginTop: '.25rem' }}>
                            ✓ Completed {new Date(e.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Payments ── */}
            {tab === 'payments' && (
              !payments.length ? (
                <div className="empty">
                  <div className="empty-icon">💳</div>
                  <h3>No payments yet</h3>
                  <p>Your purchase history will appear here.</p>
                </div>
              ) : (
                <div>
                  {payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '.875rem 1.125rem', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', marginBottom: '.5rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.9375rem' }}>
                          ${Number(p.amount).toFixed(2)}
                          <span style={{ fontWeight: 400, fontSize: '.8125rem', color: 'var(--text-3)', marginLeft: '.375rem' }}>{p.currency}</span>
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-3)', fontWeight: 500, marginTop: '.125rem' }}>
                          {new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <span className={`badge ${p.status === 'completed' ? 'badge-mint' : 'badge-neutral'}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Sessions ── */}
            {tab === 'sessions' && (
              <div>
                <div className="section-heading">
                  <h2>Active sessions <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({sessions.length})</span></h2>
                  <button className="btn btn-danger btn-sm" onClick={handleLogoutAll}>Sign out everywhere</button>
                </div>
                {!sessions.length && <p style={{ color: 'var(--text-3)', fontSize: '.875rem' }}>No active sessions found.</p>}
                {sessions.map((s) => {
                  const name = s.device_name || 'Unknown device'
                  const icon = name.toLowerCase().includes('firefox') ? '🦊'
                    : name.toLowerCase().includes('chrome') ? '🌐'
                    : name.toLowerCase().includes('safari') ? '🧭'
                    : name.toLowerCase().includes('edge') ? '🔷'
                    : s.device_type === 'mobile' ? '📱' : '💻'
                  const typeLabel = s.device_type === 'mobile' ? 'Mobile' : 'Desktop'
                  return (
                    <div key={s.id} className="session-row">
                      <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{icon}</div>
                      <div className="session-row-info">
                        <div className="session-device">{name}</div>
                        <div className="session-meta">
                          {typeLabel} · {s.ip_address || 'unknown IP'} · Last active {new Date(s.last_used_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRevoke(s.id)}>Revoke</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Profile ── */}
            {tab === 'profile' && (
              <div className="grid grid-2">
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                      Edit profile
                    </h3>
                    <form onSubmit={handleProfile}>
                      <div className="form-group">
                        <label>Full name</label>
                        <input className="input" value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Bio</label>
                        <textarea className="input" rows={4} value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          placeholder="Tell us about yourself…" />
                      </div>
                      <button className="btn btn-primary w-full">Save changes</button>
                    </form>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                      Change password
                    </h3>
                    <form onSubmit={handlePwd}>
                      <div className="form-group">
                        <label>Current password</label>
                        <input className="input" type="password" value={pwdForm.current_password}
                          onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                          autoComplete="current-password" />
                      </div>
                      <div className="form-group">
                        <label>New password</label>
                        <input className="input" type="password" value={pwdForm.new_password} minLength={8}
                          onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                          autoComplete="new-password" placeholder="At least 8 characters" />
                      </div>
                      <button className="btn btn-dark w-full">Change password</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
