import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister, login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getDeviceInfo } from '../api/device'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRegister(form)
      const { deviceName, deviceType } = getDeviceInfo()
      const { data: tokens } = await apiLogin({
        email: form.email, password: form.password,
        device_name: deviceName,
        device_type: deviceType,
      })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">
            <div className="auth-logo-pill" />
            <div className="auth-logo-dot" />
          </div>
          <h1>IDRAK<em>IYA</em></h1>
          <p className="auth-brand-tagline">The journey begins with understanding</p>
          <blockquote className="auth-brand-quote">
            Join thousands of learners.<br />
            Start teaching or learning today.
          </blockquote>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <h2>Create account</h2>
          <p className="subtitle">Start your journey with IDRAKIYA</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" className="input" name="full_name" value={form.full_name}
                onChange={handle} required autoComplete="name" placeholder="Ahmed Al-Rashid" />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" className="input" type="email" name="email" value={form.email}
                onChange={handle} required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" className="input" type="password" name="password"
                value={form.password} onChange={handle} required minLength={8}
                autoComplete="new-password" placeholder="At least 8 characters" />
            </div>
            <div className="form-group">
              <label>I want to</label>
              <div className="role-grid">
                {[
                  { value: 'student', icon: '🎓', label: 'Learn', sub: 'Student' },
                  { value: 'instructor', icon: '🧑‍🏫', label: 'Teach', sub: 'Instructor' },
                ].map((opt) => (
                  <label key={opt.value} className={`role-option${form.role === opt.value ? ' selected' : ''}`}>
                    <input type="radio" name="role" value={opt.value}
                      checked={form.role === opt.value} onChange={handle} />
                    <div className="role-option-label">{opt.icon} {opt.label}</div>
                    <div className="role-option-sub">{opt.sub}</div>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: '.25rem' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
