import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

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
      const { data: tokens } = await apiLogin({
        ...form,
        device_name: navigator.userAgent.slice(0, 40),
        device_type: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">IDRAK<span>IYA</span></div>
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to continue your learning journey</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handle} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handle} required placeholder="••••••••" />
          </div>
          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-muted">
          No account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
