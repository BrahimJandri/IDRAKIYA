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
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      myEnrollments().then((r) => setEnrollments(r.data)).catch(() => {}),
      myPayments().then((r) => setPayments(r.data)).catch(() => {}),
      getSessions().then((r) => setSessions(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleRevokeSession = async (id) => {
    await revokeSession(id)
    setSessions((s) => s.filter((x) => x.id !== id))
  }

  const handleLogoutAll = async () => {
    await logoutAll()
    logout()
    navigate('/login')
  }

  const handleProfile = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    try {
      await updateMe(profileForm)
      setMsg('Profile updated successfully')
    } catch (e) { setError(e.response?.data?.detail || 'Update failed') }
  }

  const handlePwd = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    try {
      await changePassword(pwdForm)
      setMsg('Password changed — please log in again')
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (e) { setError(e.response?.data?.detail || 'Change failed') }
  }

  const completed = enrollments.filter((e) => e.status === 'completed').length
  const inProgress = enrollments.filter((e) => e.status === 'active' && e.progress_percent > 0).length

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Hello, {user?.full_name} 👋</p>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { num: enrollments.length, label: 'Total Enrolled' },
          { num: inProgress, label: 'In Progress' },
          { num: completed, label: 'Completed' },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['learning', 'payments', 'sessions', 'profile'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setMsg(''); setError('') }}>
            {t === 'learning' ? '📚 My Courses' : t === 'payments' ? '💳 Payments' : t === 'sessions' ? '🔐 Sessions' : '👤 Profile'}
          </button>
        ))}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="spinner-center"><div className="spinner" /></div> : (
        <>
          {tab === 'learning' && (
            <div>
              {enrollments.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: '3rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
                  <p>You haven't enrolled in any courses yet.</p>
                  <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Browse Courses</button>
                </div>
              ) : (
                <div className="grid grid-2">
                  {enrollments.map((e) => (
                    <div key={e.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${e.course_id}`)}>
                      <div className="card-body">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                            {e.status}
                          </span>
                          <span className="text-sm text-muted">{e.progress_percent}%</span>
                        </div>
                        <div className="progress-bar mb-3">
                          <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                        </div>
                        <p className="text-sm text-muted">Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
                        {e.completed_at && <p className="text-sm" style={{ color: 'var(--success)' }}>✓ Completed {new Date(e.completed_at).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div>
              {payments.length === 0 ? (
                <p className="text-muted">No payments found.</p>
              ) : payments.map((p) => (
                <div key={p.id} className="card mb-3">
                  <div className="card-body flex items-center justify-between">
                    <div>
                      <div className="font-bold">${Number(p.amount).toFixed(2)} {p.currency}</div>
                      <div className="text-sm text-muted">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge ${p.status === 'completed' ? 'badge-success' : p.status === 'failed' ? 'badge-danger' : 'badge-muted'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'sessions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 700 }}>Active Sessions ({sessions.length})</h3>
                <button className="btn btn-danger btn-sm" onClick={handleLogoutAll}>Logout All Devices</button>
              </div>
              {sessions.map((s) => (
                <div key={s.id} className="card mb-3">
                  <div className="card-body flex items-center justify-between">
                    <div>
                      <div className="font-bold">{s.device_name || 'Unknown Device'}</div>
                      <div className="text-sm text-muted">
                        {s.device_type} · {s.ip_address} · Last used {new Date(s.last_used_at).toLocaleString()}
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleRevokeSession(s.id)}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'profile' && (
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>Edit Profile</h3>
                  <form onSubmit={handleProfile}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input className="form-control" value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea className="form-control" rows={3} value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
                    </div>
                    <button className="btn btn-primary w-full">Save Changes</button>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontWeight: 700, marginBottom: '1.2rem' }}>Change Password</h3>
                  <form onSubmit={handlePwd}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input className="form-control" type="password" value={pwdForm.current_password}
                        onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input className="form-control" type="password" value={pwdForm.new_password} minLength={8}
                        onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })} />
                    </div>
                    <button className="btn btn-primary w-full">Change Password</button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
