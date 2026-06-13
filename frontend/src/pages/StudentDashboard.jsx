import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { myEnrollments } from '../api/enrollments'
import { myPayments } from '../api/payments'
import { getSessions, revokeSession, logoutAll, updateMe, changePassword, setup2FA, enable2FA, disable2FA } from '../api/auth'
import { useTranslation } from 'react-i18next'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState('learning')
  const [enrollments, setEnrollments] = useState([])
  const [payments, setPayments] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' })
  const [msg, setMsg] = useState('')
  const [twoFAState, setTwoFAState] = useState(null) // null | 'setup' | 'disable'
  const [twoFAQR, setTwoFAQR] = useState(null)       // { qr_base64, otpauth_uri }
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.totp_enabled || false)
  const [err, setErr] = useState('')

  const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR'

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
    try { await updateMe(profileForm); flash(t('dashboard.profileUpdated')) }
    catch (e) { flash(e.response?.data?.detail || t('dashboard.updateFailed'), true) }
  }
  const handlePwd = async (e) => {
    e.preventDefault()
    try {
      await changePassword(pwdForm)
      flash(t('dashboard.passwordChanged'))
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (e) { flash(e.response?.data?.detail || t('dashboard.changeFailed'), true) }
  }

  const startSetup2FA = async () => {
    try {
      const { data } = await setup2FA()
      setTwoFAQR(data)
      setTwoFAState('setup')
      setTwoFACode('')
    } catch (e) { flash(e.response?.data?.detail || 'Failed to start 2FA setup', true) }
  }

  const confirmEnable2FA = async (e) => {
    e.preventDefault()
    try {
      await enable2FA(twoFACode)
      setTwoFAEnabled(true)
      setTwoFAState(null)
      setTwoFAQR(null)
      flash('Two-factor authentication enabled!')
    } catch (e) { flash(e.response?.data?.detail || 'Invalid code', true) }
  }

  const confirmDisable2FA = async (e) => {
    e.preventDefault()
    try {
      await disable2FA(twoFACode)
      setTwoFAEnabled(false)
      setTwoFAState(null)
      flash('Two-factor authentication disabled.')
    } catch (e) { flash(e.response?.data?.detail || 'Invalid code', true) }
  }

  const TABS = [
    { key: 'learning', label: t('dashboard.tabs.learning') },
    { key: 'payments', label: t('dashboard.tabs.payments') },
    { key: 'sessions', label: t('dashboard.tabs.sessions') },
    { key: 'profile',  label: t('dashboard.tabs.profile') },
  ]

  const stats = [
    { num: enrollments.length, label: t('dashboard.enrolled') },
    { num: enrollments.filter((e) => e.status === 'active' && e.progress_percent > 0).length, label: t('dashboard.inProgress') },
    { num: enrollments.filter((e) => e.status === 'completed').length, label: t('dashboard.completed') },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <p className="page-hero-eyebrow">{t('dashboard.eyebrow')}</p>
          <h1>{t('dashboard.hello')} <em>{user?.full_name?.split(' ')[0]}</em> 👋</h1>
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
                  <h3>{t('dashboard.noCoursesTitle')}</h3>
                  <p>{t('dashboard.noCoursesSub')}</p>
                  <button className="btn btn-primary" onClick={() => navigate('/courses/all')}>{t('dashboard.browseCourses')}</button>
                </div>
              ) : (
                <div className="grid grid-2">
                  {enrollments.map((e) => (
                    <div key={e.id} className="card" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/courses/${e.course_id}`)}>
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
                          {t('dashboard.enrolledDate')} {new Date(e.enrolled_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {e.completed_at && (
                          <p style={{ fontSize: '.8rem', color: 'var(--mint)', fontWeight: 600, marginTop: '.25rem' }}>
                            {t('dashboard.completedDate')} {new Date(e.completed_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                  <h3>{t('dashboard.noPaymentsTitle')}</h3>
                  <p>{t('dashboard.noPaymentsSub')}</p>
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
                          {new Date(p.created_at).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}
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
                  <h2>{t('dashboard.sessions.title')} <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({sessions.length})</span></h2>
                  <button className="btn btn-danger btn-sm" onClick={handleLogoutAll}>{t('dashboard.sessions.signOutAll')}</button>
                </div>
                {!sessions.length && <p style={{ color: 'var(--text-3)', fontSize: '.875rem' }}>{t('dashboard.sessions.noSessions')}</p>}
                {sessions.map((s) => {
                  const name = s.device_name || t('dashboard.sessions.unknownDevice')
                  const icon = name.toLowerCase().includes('firefox') ? '🦊'
                    : name.toLowerCase().includes('chrome') ? '🌐'
                    : name.toLowerCase().includes('safari') ? '🧭'
                    : name.toLowerCase().includes('edge') ? '🔷'
                    : s.device_type === 'mobile' ? '📱' : '💻'
                  const typeLabel = s.device_type === 'mobile' ? t('dashboard.sessions.mobile') : t('dashboard.sessions.desktop')
                  return (
                    <div key={s.id} className="session-row">
                      <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{icon}</div>
                      <div className="session-row-info">
                        <div className="session-device">{name}</div>
                        <div className="session-meta">
                          {typeLabel} · {s.ip_address || 'unknown IP'} · {t('dashboard.sessions.lastActive')} {new Date(s.last_used_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRevoke(s.id)}>{t('dashboard.sessions.revoke')}</button>
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
                      {t('dashboard.profile.editTitle')}
                    </h3>
                    <form onSubmit={handleProfile}>
                      <div className="form-group">
                        <label>{t('dashboard.profile.fullName')}</label>
                        <input className="input" value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>{t('dashboard.profile.bio')}</label>
                        <textarea className="input" rows={4} value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          placeholder={t('dashboard.profile.bioPlaceholder')} />
                      </div>
                      <button className="btn btn-primary w-full">{t('dashboard.profile.saveChanges')}</button>
                    </form>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>
                      {t('dashboard.profile.changePassword')}
                    </h3>
                    <form onSubmit={handlePwd}>
                      <div className="form-group">
                        <label>{t('dashboard.profile.currentPassword')}</label>
                        <input className="input" type="password" value={pwdForm.current_password}
                          onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                          autoComplete="current-password" />
                      </div>
                      <div className="form-group">
                        <label>{t('dashboard.profile.newPassword')}</label>
                        <input className="input" type="password" value={pwdForm.new_password} minLength={8}
                          onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                          autoComplete="new-password" placeholder={t('dashboard.profile.newPasswordPlaceholder')} />
                      </div>
                      <button className="btn btn-dark w-full">{t('dashboard.profile.changePasswordBtn')}</button>
                    </form>
                  </div>
                </div>

                {/* 2FA card */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '.25rem' }}>
                          🔐 Two-Factor Authentication
                        </h3>
                        <p style={{ fontSize: '.875rem', color: 'var(--text-3)' }}>
                          {twoFAEnabled
                            ? 'Your account is protected with an authenticator app.'
                            : 'Add an extra layer of security using Google Authenticator or Authy.'}
                        </p>
                      </div>
                      {twoFAState === null && (
                        twoFAEnabled
                          ? <button className="btn btn-danger btn-sm" onClick={() => { setTwoFAState('disable'); setTwoFACode('') }}>Disable 2FA</button>
                          : <button className="btn btn-primary btn-sm" onClick={startSetup2FA}>Enable 2FA</button>
                      )}
                    </div>

                    {/* Setup: show QR + confirm code */}
                    {twoFAState === 'setup' && twoFAQR && (
                      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '.8125rem', color: 'var(--text-3)', marginBottom: '.75rem' }}>
                            Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>:
                          </p>
                          <img
                            src={`data:image/png;base64,${twoFAQR.qr_base64}`}
                            alt="2FA QR Code"
                            style={{ width: 160, height: 160, border: '4px solid var(--border)', borderRadius: 8 }}
                          />
                        </div>
                        <form onSubmit={confirmEnable2FA} style={{ flex: 1, minWidth: 220 }}>
                          <p style={{ fontSize: '.8125rem', color: 'var(--text-3)', marginBottom: '.75rem' }}>
                            Then enter the 6-digit code to confirm:
                          </p>
                          <div className="form-group">
                            <input
                              className="input"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="000000"
                              value={twoFACode}
                              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                              style={{ letterSpacing: '0.3em', fontSize: '1.25rem', textAlign: 'center' }}
                              autoFocus
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <button className="btn btn-primary" disabled={twoFACode.length !== 6}>Confirm & Enable</button>
                            <button type="button" className="btn btn-secondary" onClick={() => { setTwoFAState(null); setTwoFAQR(null) }}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Disable: confirm code */}
                    {twoFAState === 'disable' && (
                      <form onSubmit={confirmDisable2FA} style={{ marginTop: '1.25rem', maxWidth: 280 }}>
                        <div className="form-group">
                          <label style={{ fontSize: '.875rem' }}>Enter your current authenticator code to disable:</label>
                          <input
                            className="input"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={twoFACode}
                            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                            style={{ letterSpacing: '0.3em', fontSize: '1.25rem', textAlign: 'center' }}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-danger" disabled={twoFACode.length !== 6}>Confirm Disable</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setTwoFAState(null)}>Cancel</button>
                        </div>
                      </form>
                    )}
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
