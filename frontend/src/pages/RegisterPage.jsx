import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister, login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'

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
      const { data: tokens } = await apiLogin({
        email: form.email,
        password: form.password,
        device_name: navigator.userAgent.slice(0, 40),
        device_type: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
      const { data: user } = await getMe()
      login(tokens, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">IDRAK<span>IYA</span></div>
        <h2>Create account</h2>
        <p className="subtitle">Start learning or teaching today</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" name="full_name" value={form.full_name}
              onChange={handle} required placeholder="Ahmed Al-Rashid" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handle} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handle} required placeholder="Min. 8 characters" minLength={8} />
          </div>
          <div className="form-group">
            <label>I want to</label>
            <select className="form-control" name="role" value={form.role} onChange={handle}>
              <option value="student">Learn (Student)</option>
              <option value="instructor">Teach (Instructor)</option>
            </select>
          </div>
          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-muted">
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
