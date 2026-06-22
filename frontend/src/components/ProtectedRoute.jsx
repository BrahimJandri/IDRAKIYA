import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/" replace />

  // 2FA enforcement disabled — re-enable when email/SMTP is configured
  // if (!user.totp_enabled) return <Navigate to="/2fa-setup" replace />

  if (role === 'instructor' && user.role === 'student') return <Navigate to="/courses/all" replace />
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/courses/all" replace />

  return children
}
