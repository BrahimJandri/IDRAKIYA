import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getDeviceInfo } from '../api/device'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      setError(err.response?.data?.detail || 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">
            <div className="auth-logo-pill" />
            <div className="auth-logo-dot" />
          </div>
          <h1>IDRAK<em>IYA</em></h1>
          <p className="auth-brand-tagline">The journey begins with understanding</p>
          <blockquote className="auth-brand-quote">
            Shape your future.<br />
            Courses to elevate your knowledge and logic.
          </blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to continue learning</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" name="email"
                value={form.email} onChange={handle} required autoComplete="email"
                placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" className="input" type="password" name="password"
                value={form.password} onChange={handle} required autoComplete="current-password"
                placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: '.5rem' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer-link">
            No account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
