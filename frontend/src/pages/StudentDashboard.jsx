import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { myEnrollments } from '../api/enrollments'
import { listCourses } from '../api/courses'
import { getSessions, revokeSession, logoutAll, updateMe, changePassword, setup2FA, enable2FA, disable2FA, uploadAvatar } from '../api/auth'
import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import { mediaUrl } from '../utils/media'

const NAV_ITEMS = [
  { key: 'learning', icon: '🎓', labelKey: 'dashboard.tabs.learning' },
  { key: 'profile',  icon: '👤', labelKey: 'dashboard.tabs.profile'  },
]

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="db-stat-card" style={{ '--accent': accent }}>
      <div className="db-stat-icon">{icon}</div>
      <div className="db-stat-value">{value}</div>
      <div className="db-stat-label">{label}</div>
    </div>
  )
}

function SectionHeader({ title, action }) {
  return (
    <div className="db-section-header">
      <h2 className="db-section-title">{title}</h2>
      {action}
    </div>
  )
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState('learning')
  const [enrollments, setEnrollments] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' })
  const [msg, setMsg] = useState('')
  const [twoFAState, setTwoFAState] = useState(null)
  const [twoFAQR, setTwoFAQR] = useState(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.totp_enabled || false)
  const [err, setErr] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ? mediaUrl(user.avatar_url) : null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef(null)
  const locale = 'ar-DZ'

  useEffect(() => {
    Promise.all([
      myEnrollments().then((r) => {
        setEnrollments(r.data)
        if (!r.data.length) {
          listCourses({ is_published: true }).then((c) => setAvailableCourses(c.data)).catch(() => {})
        }
      }).catch(() => {}),
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
    logout(); navigate('/')
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
      setTimeout(() => { logout(); navigate('/') }, 2000)
    } catch (e) { flash(e.response?.data?.detail || t('dashboard.changeFailed'), true) }
  }
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploading(true)
    try {
      const { data: updated } = await uploadAvatar(file)
      setAvatarPreview(mediaUrl(updated.avatar_url))
      flash('تم تحديث الصورة الشخصية')
    } catch (e) {
      flash(e.response?.data?.detail || 'فشل رفع الصورة', true)
      setAvatarPreview(user?.avatar_url ? mediaUrl(user.avatar_url) : null)
    } finally {
      setAvatarUploading(false)
    }
  }

  const startSetup2FA = async () => {
    try {
      const { data } = await setup2FA()
      setTwoFAQR(data); setTwoFAState('setup'); setTwoFACode('')
    } catch (e) { flash(e.response?.data?.detail || 'فشل تفعيل التحقق', true) }
  }
  const confirmEnable2FA = async (e) => {
    e.preventDefault()
    try {
      await enable2FA(twoFACode)
      setTwoFAEnabled(true); setTwoFAState(null); setTwoFAQR(null)
      flash('تم تفعيل التحقق بخطوتين!')
    } catch (e) { flash(e.response?.data?.detail || 'رمز غير صحيح', true) }
  }
  const confirmDisable2FA = async (e) => {
    e.preventDefault()
    try {
      await disable2FA(twoFACode)
      setTwoFAEnabled(false); setTwoFAState(null)
      flash('تم تعطيل التحقق بخطوتين.')
    } catch (e) { flash(e.response?.data?.detail || 'رمز غير صحيح', true) }
  }


  const getDeviceIcon = (s) => {
    const n = (s.device_name || '').toLowerCase()
    if (n.includes('firefox')) return '🦊'
    if (n.includes('chrome')) return '🌐'
    if (n.includes('safari')) return '🧭'
    if (n.includes('edge')) return '🔷'
    return s.device_type === 'mobile' ? '📱' : '💻'
  }

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="db-root" dir="rtl">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="db-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`db-sidebar${sidebarOpen ? ' db-sidebar--open' : ''}`}>
        {/* Avatar + name */}
        <div className="db-sidebar-profile">
          <div className="db-avatar db-avatar--sidebar">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
              : initials
            }
          </div>
          <div>
            <div className="db-avatar-name">{user?.full_name}</div>
            <div className="db-avatar-email">{user?.email}</div>
          </div>
        </div>

        <div className="db-sidebar-divider" />

        {/* Nav */}
        <nav className="db-nav">
          {NAV_ITEMS.map(({ key, icon, labelKey }) => (
            <button
              key={key}
              className={`db-nav-item${tab === key ? ' db-nav-item--active' : ''}`}
              onClick={() => { setTab(key); setMsg(''); setErr(''); setSidebarOpen(false) }}
            >
              <span className="db-nav-icon">{icon}</span>
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="db-sidebar-divider" />

      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        {/* Top bar */}
        <header className="db-topbar">
          <button className="db-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="القائمة">
            <span /><span /><span />
          </button>
          <div className="db-topbar-avatar">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
              : initials
            }
          </div>
        </header>

        {/* Welcome banner */}
        <div className="db-banner">
          <div className="db-banner-text">
            <div className="db-banner-greeting">{t('dashboard.hello')} <strong>{user?.full_name?.split(' ')[0]}</strong> 👋</div>
            <div className="db-banner-sub">مرحباً بك في لوحة التحكم الخاصة بك</div>
          </div>
        </div>

        {/* Alerts */}
        <div className="db-content">
          {msg && <div className="db-alert db-alert--success">✅ {msg}</div>}
          {err && <div className="db-alert db-alert--error">❌ {err}</div>}

          {loading ? (
            <div className="db-loading">
              <div className="db-spinner" />
              <span>جارٍ التحميل…</span>
            </div>
          ) : (
            <>
              {/* ══ MY COURSES ══ */}
              {tab === 'learning' && (
                !enrollments.length ? (
                  <div>
                    {availableCourses.length > 0 ? (
                      <>
                        <div className="db-section-header" style={{ marginBottom: '1rem' }}>
                          <h2 className="db-section-title">الدورات المتاحة</h2>
                        </div>
                        <div className="db-grid">
                          {availableCourses.map((c) => (
                            <div key={c.id} className="db-course-card" onClick={() => navigate(`/courses/${c.id}`)}>
                              {c.thumbnail_url && (
                                <img src={mediaUrl(c.thumbnail_url)} alt={c.title} className="db-course-thumb" />
                              )}
                              <div className="db-course-body">
                                <div className="db-course-title">{c.title}</div>
                                <div className="db-course-meta">
                                  <span>📖 {c.total_lessons} {t('common.lessons')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="db-empty">
                        <div className="db-empty-icon">📖</div>
                        <h3>{t('dashboard.noCoursesTitle')}</h3>
                        <p>{t('dashboard.noCoursesSub')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="db-grid">
                    {enrollments.map((e) => (
                      <div key={e.id} className="db-course-card" onClick={() => navigate(`/courses/${e.course_id}`)}>
                        {e.course?.thumbnail_url && (
                          <img
                            src={mediaUrl(e.course.thumbnail_url)}
                            alt={e.course.title}
                            className="db-course-thumb"
                          />
                        )}
                        <div className="db-course-progress-bar">
                          <div className="db-course-progress-fill" style={{ width: `${e.progress_percent}%` }} />
                        </div>
                        <div className="db-course-body">
                          {e.course?.title && (
                            <div className="db-course-title">{e.course.title}</div>
                          )}
                          <div className="db-course-top">
                            <span className={`db-badge ${e.status === 'completed' ? 'db-badge--mint' : 'db-badge--amber'}`}>
                              {e.status === 'completed' ? '✅ مكتمل' : '⚡ جارٍ'}
                            </span>
                            <span className="db-course-pct">{e.progress_percent}%</span>
                          </div>
                          <div className="db-course-track">
                            <div className="db-course-track-fill" style={{ width: `${e.progress_percent}%` }} />
                          </div>
                          <div className="db-course-meta">
                            <span>📅 {t('dashboard.enrolledDate')} {new Date(e.enrolled_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {e.completed_at && (
                              <span style={{ color: 'var(--mint)' }}>
                                {t('dashboard.completedDate')} {new Date(e.completed_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ══ SESSIONS ══ */}
              {tab === 'sessions' && (
                <div>
                  <SectionHeader
                    title={`${t('dashboard.sessions.title')} (${sessions.length})`}
                    action={
                      <button className="db-btn db-btn--danger db-btn--sm" onClick={handleLogoutAll}>
                        🚪 {t('dashboard.sessions.signOutAll')}
                      </button>
                    }
                  />
                  {!sessions.length && (
                    <div className="db-empty">
                      <div className="db-empty-icon">🔒</div>
                      <p>{t('dashboard.sessions.noSessions')}</p>
                    </div>
                  )}
                  <div className="db-sessions">
                    {sessions.map((s) => (
                      <div key={s.id} className="db-session-card">
                        <div className="db-session-icon">{getDeviceIcon(s)}</div>
                        <div className="db-session-info">
                          <div className="db-session-name">{s.device_name || t('dashboard.sessions.unknownDevice')}</div>
                          <div className="db-session-meta">
                            <span>{s.device_type === 'mobile' ? t('dashboard.sessions.mobile') : t('dashboard.sessions.desktop')}</span>
                            <span>·</span>
                            <span>{s.ip_address || '—'}</span>
                            <span>·</span>
                            <span>{t('dashboard.sessions.lastActive')} {new Date(s.last_used_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <button className="db-btn db-btn--ghost db-btn--sm" onClick={() => handleRevoke(s.id)}>
                          {t('dashboard.sessions.revoke')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ PROFILE ══ */}
              {tab === 'profile' && (
                <div className="db-profile-grid">
                  {/* Edit profile */}
                  <div className="db-card">
                    <div className="db-card-header">
                      <h3>✏️ {t('dashboard.profile.editTitle')}</h3>
                    </div>
                    <div className="db-card-body">
                      {/* Avatar uploader */}
                      <div className="db-avatar-upload">
                        <div className="db-avatar-preview-wrap" onClick={() => avatarInputRef.current?.click()}>
                          {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" className="db-avatar-preview-img" />
                            : <div className="db-avatar-preview-initials">{initials}</div>
                          }
                          <div className="db-avatar-overlay">
                            {avatarUploading ? <div className="db-spinner db-spinner--sm" /> : <span>📷</span>}
                          </div>
                        </div>
                        <div className="db-avatar-upload-info">
                          <div className="db-avatar-upload-label">الصورة الشخصية</div>
                          <div className="db-avatar-upload-hint">JPG، PNG، WebP — 5 ميغابايت كحد أقصى</div>
                          <button type="button" className="db-btn db-btn--ghost db-btn--sm" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                            {avatarUploading ? 'جارٍ الرفع…' : 'تغيير الصورة'}
                          </button>
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                          style={{ display: 'none' }} onChange={handleAvatarChange} />
                      </div>

                      <div className="db-divider" />

                      <form onSubmit={handleProfile} className="db-form">
                        <div className="db-form-group">
                          <label>{t('dashboard.profile.fullName')}</label>
                          <input className="db-input" value={profileForm.full_name}
                            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                        </div>
                        <div className="db-form-group">
                          <label>{t('dashboard.profile.bio')}</label>
                          <textarea className="db-input db-textarea" rows={4} value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            placeholder={t('dashboard.profile.bioPlaceholder')} />
                        </div>
                        <button className="db-btn db-btn--primary db-btn--full">{t('dashboard.profile.saveChanges')}</button>
                      </form>
                    </div>
                  </div>

                  {/* Change password */}
                  <div className="db-card">
                    <div className="db-card-header">
                      <h3>🔑 {t('dashboard.profile.changePassword')}</h3>
                    </div>
                    <div className="db-card-body">
                      <form onSubmit={handlePwd} className="db-form">
                        <div className="db-form-group">
                          <label>{t('dashboard.profile.currentPassword')}</label>
                          <input className="db-input" type="password" value={pwdForm.current_password}
                            onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                            autoComplete="current-password" />
                        </div>
                        <div className="db-form-group">
                          <label>{t('dashboard.profile.newPassword')}</label>
                          <input className="db-input" type="password" value={pwdForm.new_password} minLength={8}
                            onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                            autoComplete="new-password" placeholder={t('dashboard.profile.newPasswordPlaceholder')} />
                        </div>
                        <button className="db-btn db-btn--dark db-btn--full">{t('dashboard.profile.changePasswordBtn')}</button>
                      </form>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="db-card db-card--full">
                    <div className="db-card-header">
                      <h3>🔐 التحقق بخطوتين</h3>
                      {twoFAState === null && (
                        twoFAEnabled
                          ? <button className="db-btn db-btn--danger db-btn--sm" onClick={() => { setTwoFAState('disable'); setTwoFACode('') }}>تعطيل</button>
                          : <button className="db-btn db-btn--primary db-btn--sm" onClick={startSetup2FA}>تفعيل</button>
                      )}
                    </div>
                    <div className="db-card-body">
                      <p className="db-2fa-desc">
                        {twoFAEnabled
                          ? '✅ حسابك محمي بتطبيق المصادقة.'
                          : 'أضف طبقة أمان إضافية باستخدام Google Authenticator أو Authy.'}
                      </p>

                      {twoFAState === 'setup' && twoFAQR && (
                        <div className="db-2fa-setup">
                          <div>
                            <p className="db-2fa-hint">امسح رمز QR بتطبيق <strong>Google Authenticator</strong>:</p>
                            <img src={`data:image/png;base64,${twoFAQR.qr_base64}`} alt="QR Code"
                              className="db-2fa-qr" />
                          </div>
                          <form onSubmit={confirmEnable2FA} className="db-form db-2fa-form">
                            <p className="db-2fa-hint">أدخل الرمز المكوّن من 6 أرقام للتأكيد:</p>
                            <input className="db-input db-otp-input" type="text" inputMode="numeric"
                              maxLength={6} placeholder="000000" value={twoFACode}
                              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))} autoFocus />
                            <div className="db-btn-row">
                              <button className="db-btn db-btn--primary" disabled={twoFACode.length !== 6}>تأكيد وتفعيل</button>
                              <button type="button" className="db-btn db-btn--ghost" onClick={() => { setTwoFAState(null); setTwoFAQR(null) }}>إلغاء</button>
                            </div>
                          </form>
                        </div>
                      )}

                      {twoFAState === 'disable' && (
                        <form onSubmit={confirmDisable2FA} className="db-form db-2fa-disable">
                          <label className="db-form-group">
                            <span>أدخل رمز المصادقة الحالي لتعطيل الخاصية:</span>
                            <input className="db-input db-otp-input" type="text" inputMode="numeric"
                              maxLength={6} placeholder="000000" value={twoFACode}
                              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))} autoFocus />
                          </label>
                          <div className="db-btn-row">
                            <button className="db-btn db-btn--danger" disabled={twoFACode.length !== 6}>تأكيد التعطيل</button>
                            <button type="button" className="db-btn db-btn--ghost" onClick={() => setTwoFAState(null)}>إلغاء</button>
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
      </main>
    </div>
  )
}
