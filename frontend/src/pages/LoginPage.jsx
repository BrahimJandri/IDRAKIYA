import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getDeviceInfo } from '../api/device'
import { useTranslation } from 'react-i18next'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { deviceName, deviceType } = getDeviceInfo()
      const { data: tokens } = await apiLogin({
        ...form,
        device_name: deviceName,
        device_type: deviceType,
      })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || t('login.errorDefault'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">

      {/* ── LEFT: Form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">

          {/* Logo */}
          <div className="auth-form-logo">
            <div className="auth-logo-badge">
              <div className="auth-logo-pill" />
              <div className="auth-logo-dot" />
            </div>
            <span className="auth-form-logo-name">IDRAK<em>IYA</em></span>
          </div>

          <div className="auth-form-head">
            <h2>{t('login.title')}</h2>
            <p className="subtitle">{t('login.subtitle')}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="email">{t('login.email')}</label>
              <div className="input-wrap">
                <EnvelopeIcon className="input-icon-left" />
                <input id="email" className="input input-icon-pad" type="email" name="email"
                  value={form.email} onChange={handle} required autoComplete="email"
                  placeholder={t('login.emailPlaceholder')} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password">{t('login.password')}</label>
                <span className="auth-forgot">{t('login.forgotPassword')}</span>
              </div>
              <div className="input-wrap">
                <LockClosedIcon className="input-icon-left" />
                <input id="password" className="input input-icon-pad input-icon-pad-right"
                  type={showPwd ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handle} required autoComplete="current-password"
                  placeholder={t('login.passwordPlaceholder')} />
                <button type="button" className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button className="btn btn-auth-submit" disabled={loading}>
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="auth-footer-link">
            {t('login.noAccount')} <Link to="/register">{t('login.createOne')}</Link>
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
                {t('login.testimonialName').split(' ').map(w => w[0]).join('').slice(0,2)}
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
