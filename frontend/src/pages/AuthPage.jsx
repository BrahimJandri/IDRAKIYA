import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister, googleAuth, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getDeviceInfo } from '../api/device'
import { useTranslation } from 'react-i18next'
import { EnvelopeIcon, LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'configure-google-client-id'

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
  </svg>
)

function GoogleButton({ onSuccess, onError, disabled, label }) {
  const googleLogin = useGoogleLogin({ onSuccess, onError })
  return (
    <button className="btn-google" onClick={() => googleLogin()} disabled={disabled}>
      {GOOGLE_ICON}
      {label}
    </button>
  )
}

function AuthPageInner() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [tab, setTab]         = useState('login')   // 'login' | 'register'
  const [form, setForm]       = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handle = (e) => {
    setError('')
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const switchTab = (next) => {
    setTab(next)
    setError('')
    setShowPwd(false)
    setForm({ full_name: '', email: '', password: '', role: 'student' })
  }

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')

  const handleGoogleSuccess = async (tokenResponse) => {
    setError('')
    setLoading(true)
    try {
      const { deviceName, deviceType } = getDeviceInfo()
      const { data: tokens } = await googleAuth({
        access_token: tokenResponse.access_token,
        device_name: deviceName,
        device_type: deviceType,
      })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/courses')
    } catch (err) {
      setError(err.response?.data?.detail || t('login.googleError'))
    } finally {
      setLoading(false)
    }
  }


  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { deviceName, deviceType } = getDeviceInfo()

      if (tab === 'register') {
        await apiRegister(form)
      }

      const { data: tokens } = await apiLogin({
        email: form.email,
        password: form.password,
        device_name: deviceName,
        device_type: deviceType,
      })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/courses')
    } catch (err) {
      setError(err.response?.data?.detail || (
        tab === 'login' ? t('login.errorDefault') : t('register.errorDefault')
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">

      {/* ── LEFT: Form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">

          {/* Logo + lang toggle */}
          <div className="auth-form-top-row">
            <div className="auth-form-logo">
              <div className="auth-logo-badge">
                <div className="auth-logo-pill" />
                <div className="auth-logo-dot" />
              </div>
              <span className="auth-form-logo-name">IDRAK<em>IYA</em></span>
            </div>
            <button className="lang-toggle-light" onClick={toggleLang}>
              {i18n.language === 'ar' ? 'FR' : 'ع'}
            </button>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn${tab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
            >
              {t('nav.signIn')}
            </button>
            <button
              className={`auth-tab-btn${tab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
            >
              {t('register.create')}
            </button>
          </div>

          {/* Heading */}
          <div className="auth-form-head">
            <h2>{tab === 'login' ? t('login.title') : t('register.title')}</h2>
            <p className="subtitle">
              {tab === 'login' ? t('login.subtitle') : t('register.subtitle')}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {/* Full name — register only */}
            {tab === 'register' && (
              <div className="form-group">
                <label htmlFor="full_name">{t('register.fullName')}</label>
                <div className="input-wrap">
                  <UserIcon className="input-icon-left" />
                  <input
                    id="full_name" className="input input-icon-pad" name="full_name"
                    value={form.full_name} onChange={handle} required autoComplete="name"
                    placeholder={t('register.fullNamePlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">{t('login.email')}</label>
              <div className="input-wrap">
                <EnvelopeIcon className="input-icon-left" />
                <input
                  id="email" className="input input-icon-pad" type="email" name="email"
                  value={form.email} onChange={handle} required autoComplete="email"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password">{t('login.password')}</label>
                {tab === 'login' && (
                  <span className="auth-forgot">{t('login.forgotPassword')}</span>
                )}
              </div>
              <div className="input-wrap">
                <LockClosedIcon className="input-icon-left" />
                <input
                  id="password"
                  className="input input-icon-pad input-icon-pad-right"
                  type={showPwd ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handle} required
                  minLength={tab === 'register' ? 8 : undefined}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  placeholder={tab === 'login' ? t('login.passwordPlaceholder') : t('register.passwordPlaceholder')}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button className="btn-auth-submit" disabled={loading}>
              {loading
                ? (tab === 'login' ? t('login.signingIn') : t('register.creating'))
                : (tab === 'login' ? t('login.signIn')    : t('register.create'))
              }
            </button>
          </form>

          <div className="auth-or-divider"><span>{t('login.orDivider')}</span></div>
          <GoogleButton onSuccess={handleGoogleSuccess} onError={() => setError(t('login.googleError'))} disabled={loading} label={t('login.continueWithGoogle')} />

          <p className="auth-footer-link">
            {tab === 'login' ? (
              <>{t('login.noAccount')} <button className="auth-switch-btn" onClick={() => switchTab('register')}>{t('login.createOne')}</button></>
            ) : (
              <>{t('register.alreadyHave')} <button className="auth-switch-btn" onClick={() => switchTab('login')}>{t('register.signIn')}</button></>
            )}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Brand panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <h1 className="auth-brand-heading">{t('login.heroTitle')}</h1>

          <div className="auth-testimonial">
            <div className="auth-testimonial-quote-icon">"</div>
            <p className="auth-testimonial-text">{t('login.testimonialText')}</p>
            <div className="auth-testimonial-author">
              <div className="auth-testimonial-avatar">
                {t('login.testimonialName').split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="auth-testimonial-name">{t('login.testimonialName')}</div>
                <div className="auth-testimonial-role">{t('login.testimonialRole')}</div>
              </div>
            </div>
          </div>

          <div className="auth-brand-bottom">
            <div className="auth-join-label">{t('login.joinStats')}</div>
            <div className="auth-stats-row">
              <div className="auth-stat-chip">🎓 500+ {t('login.statCourses')}</div>
              <div className="auth-stat-chip">👥 5K+ {t('login.statStudents')}</div>
              <div className="auth-stat-chip">⭐ 4.8 {t('login.statRating')}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default function AuthPage() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthPageInner />
      </GoogleOAuthProvider>
    )
  }
  return <AuthPageInner />
}
